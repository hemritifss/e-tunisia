import {
    Injectable, BadRequestException, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, Not } from 'typeorm';
import { CreditBalance } from './credit-balance.entity';
import { CreditTransaction, CreditTxKind } from './credit-transaction.entity';
import { Donation, DonationTarget } from './donation.entity';
import { ReferralReward } from './referral-reward.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || 10); // 10 % commission
const PLATFORM_USER_EMAIL = process.env.PLATFORM_USER_EMAIL || 'platform@etunisia.tn';

/** Virtual gifts — Tunisian-themed tips. Prices in TND; sending one is a donation. */
export const GIFT_CATALOG: Array<{ id: string; label: string; emoji: string; price: number }> = [
    { id: 'jasmine', label: 'Jasmine', emoji: '🌼', price: 1 },
    { id: 'mint_tea', label: 'Mint Tea', emoji: '🍵', price: 3 },
    { id: 'dates', label: 'Box of Dates', emoji: '🌴', price: 5 },
    { id: 'carpet', label: 'Kairouan Carpet', emoji: '🧶', price: 15 },
    { id: 'camel', label: 'Camel', emoji: '🐪', price: 50 },
];

@Injectable()
export class CreditsService {
    constructor(
        @InjectRepository(CreditBalance) private balances: Repository<CreditBalance>,
        @InjectRepository(CreditTransaction) private txs: Repository<CreditTransaction>,
        @InjectRepository(Donation) private donations: Repository<Donation>,
        @InjectRepository(ReferralReward) private referrals: Repository<ReferralReward>,
        @InjectRepository(User) private users: Repository<User>,
        private dataSource: DataSource,
        private notifications: NotificationsService,
    ) {}

    /** Return-or-create the row holding a user's balance. */
    private async ensureBalance(userId: string): Promise<CreditBalance> {
        let bal = await this.balances.findOne({ where: { userId } });
        if (!bal) {
            bal = await this.balances.save(this.balances.create({ userId, balance: 0 }));
        }
        return bal;
    }

    /** The shared "platform" user that holds commissions + receives platform donations. */
    private async ensurePlatformUser(): Promise<User> {
        let user = await this.users.findOne({ where: { email: PLATFORM_USER_EMAIL } });
        if (!user) {
            const created = this.users.create({
                fullName: 'e-Tunisia Platform',
                email: PLATFORM_USER_EMAIL,
                password: 'platform-account-no-login',
                role: 'admin' as any,
            } as any) as unknown as User;
            user = (await this.users.save(created as any)) as unknown as User;
        }
        await this.ensureBalance(user.id);
        return user;
    }

    async getBalance(userId: string) {
        const bal = await this.ensureBalance(userId);
        const recent = await this.txs.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 25,
        });
        return {
            balance: Number(bal.balance),
            lifetimeIn: Number(bal.lifetimeIn),
            lifetimeOut: Number(bal.lifetimeOut),
            recent,
        };
    }

    /** Credit a user inside an existing transaction (balance + audit tx). */
    private async creditInTx(
        mgr: any, userId: string, amount: number, kind: CreditTxKind, note: string, counterpartyId?: string,
    ) {
        const bal = await mgr.findOne(CreditBalance, { where: { userId } })
            ?? mgr.create(CreditBalance, { userId, balance: 0 });
        const after = Number(bal.balance) + amount;
        bal.balance = after;
        bal.lifetimeIn = Number(bal.lifetimeIn) + amount;
        await mgr.save(bal);
        await mgr.save(mgr.create(CreditTransaction, { userId, kind, amount, counterpartyId, note, balanceAfter: after }));
    }

    /**
     * Give-10-get-10. Credits the referee's welcome bonus IMMEDIATELY (it's
     * non-extractable — no cash-out — so farming it is pointless) and records the
     * referrer's reward as PENDING. The referrer is paid only once the referee shows
     * real intent (first top-up — see deposit()). `refereeId` is unique, so a user
     * can only ever be referred once.
     */
    async createPendingReferral(refereeId: string, referrerId: string) {
        const reward = Number(process.env.REFERRAL_REWARD_TND || 10);
        if (reward <= 0 || refereeId === referrerId) return;
        // Pending referrer reward (unique refereeId guards against double-referral).
        try {
            await this.referrals.save(this.referrals.create({ refereeId, referrerId, status: 'pending', amount: reward }));
        } catch {
            return; // already referred — don't also re-credit the welcome bonus
        }
        await this.dataSource.transaction(async (mgr) => {
            await this.creditInTx(mgr, refereeId, reward, CreditTxKind.REFERRAL, 'Welcome bonus — joined via a referral', referrerId);
        });
    }

    /**
     * Release the pending referrer reward for a referee who just showed real intent.
     * Idempotent (only acts on a `pending` row). Respects REFERRAL_MAX_REWARDS per referrer.
     */
    async releasePendingReferralForReferee(refereeId: string) {
        const maxRewards = Number(process.env.REFERRAL_MAX_REWARDS || 100);
        let releasedTo: { referrerId: string; amount: number } | null = null;
        await this.dataSource.transaction(async (mgr) => {
            const reward = await mgr.findOne(ReferralReward, { where: { refereeId, status: 'pending' } });
            if (!reward) return;
            const alreadyReleased = await mgr.count(ReferralReward, { where: { referrerId: reward.referrerId, status: 'released' } });
            reward.status = 'released';
            reward.releasedAt = new Date();
            if (alreadyReleased >= maxRewards) {
                reward.amount = 0; // cap hit — close it out without paying
            } else {
                await this.creditInTx(mgr, reward.referrerId, Number(reward.amount), CreditTxKind.REFERRAL, 'Referral reward — your friend got started', refereeId);
                releasedTo = { referrerId: reward.referrerId, amount: Number(reward.amount) };
            }
            await mgr.save(reward);
        });
        if (releasedTo) {
            try {
                await this.notifications.create(
                    releasedTo.referrerId,
                    'Referral reward unlocked',
                    `${releasedTo.amount} TND credit added — your friend got started.`,
                    NotificationType.DONATION,
                    { amount: releasedTo.amount },
                );
            } catch { /* never block on a notification */ }
        }
    }

    /** Referral summary for the credits page: how many joined + how many rewards are still pending. */
    async referralStats(userId: string) {
        const [released, pending] = await Promise.all([
            this.referrals.count({ where: { referrerId: userId, status: 'released' } }),
            this.referrals.count({ where: { referrerId: userId, status: 'pending' } }),
        ]);
        return { released, pending, rewardTnd: Number(process.env.REFERRAL_REWARD_TND || 10) };
    }

    /** Mock top-up — no real payment gateway yet, just adds the amount. */
    async deposit(userId: string, amount: number, note?: string) {
        if (amount <= 0) throw new BadRequestException('Amount must be > 0');
        if (amount > 5000) throw new BadRequestException('Single top-up capped at 5000 TND');
        const tx = await this.dataSource.transaction(async (mgr) => {
            const bal = await mgr.findOne(CreditBalance, { where: { userId } })
                ?? mgr.create(CreditBalance, { userId, balance: 0 });
            const newBalance = Number(bal.balance) + amount;
            bal.balance = newBalance;
            bal.lifetimeIn = Number(bal.lifetimeIn) + amount;
            await mgr.save(bal);

            const txRow = mgr.create(CreditTransaction, {
                userId,
                kind: CreditTxKind.DEPOSIT,
                amount,
                note: note || `Top-up of ${amount} TND`,
                balanceAfter: newBalance,
            });
            return mgr.save(txRow);
        });

        // A real top-up is the "real intent" signal that releases a pending referral reward.
        try { await this.releasePendingReferralForReferee(userId); } catch { /* best-effort */ }

        return tx;
    }

    /**
     * Charge a user for boosting a place listing.
     * Moves credits to the platform balance and records both legs.
     * Throws BadRequestException if insufficient balance.
     */
    async chargeBoost(payerUserId: string, amount: number, note: string, placeId: string) {
        if (amount <= 0) throw new BadRequestException('Boost amount must be > 0');
        const platform = await this.ensurePlatformUser();
        return this.dataSource.transaction(async (mgr) => {
            const bal = await mgr.findOne(CreditBalance, { where: { userId: payerUserId } });
            const current = Number(bal?.balance || 0);
            if (current < amount) throw new BadRequestException('Insufficient credits — top up to boost');
            const newBalance = current - amount;
            bal!.balance = newBalance;
            bal!.lifetimeOut = Number(bal!.lifetimeOut) + amount;
            await mgr.save(bal!);

            // Outgoing leg
            await mgr.save(mgr.create(CreditTransaction, {
                userId: payerUserId,
                kind: CreditTxKind.BOOST,
                amount: -amount,
                counterpartyId: platform.id,
                note,
                balanceAfter: newBalance,
                donationId: placeId, // re-use the column to point at the boosted place
            }));

            // Platform receives the boost spend
            const platBal = await mgr.findOne(CreditBalance, { where: { userId: platform.id } })
                ?? mgr.create(CreditBalance, { userId: platform.id, balance: 0 });
            const platNew = Number(platBal.balance || 0) + amount;
            platBal.balance = platNew;
            platBal.lifetimeIn = Number(platBal.lifetimeIn || 0) + amount;
            await mgr.save(platBal);

            await mgr.save(mgr.create(CreditTransaction, {
                userId: platform.id,
                kind: CreditTxKind.BOOST,
                amount,
                counterpartyId: payerUserId,
                note: `Boost revenue: ${note}`,
                balanceAfter: platNew,
                donationId: placeId,
            }));

            return { balance: newBalance, charged: amount };
        });
    }

    /** Move credits from sender to recipient (or platform) and skim a commission. */
    async donate(
        fromUserId: string,
        opts: {
            target: DonationTarget;
            toUserId?: string;
            amount: number;
            message?: string;
            isAnonymous?: boolean;
            giftType?: string;
        },
    ) {
        const amount = Number(opts.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new BadRequestException('Amount must be > 0');
        }
        if (amount > 5000) throw new BadRequestException('Single donation capped at 5000 TND');

        const platformUser = await this.ensurePlatformUser();
        let recipientId: string;
        if (opts.target === DonationTarget.PLATFORM) {
            recipientId = platformUser.id;
        } else {
            if (!opts.toUserId) throw new BadRequestException('toUserId required');
            if (opts.toUserId === fromUserId) throw new BadRequestException('Cannot donate to yourself');
            const recipient = await this.users.findOne({ where: { id: opts.toUserId } });
            if (!recipient) throw new NotFoundException('Recipient user not found');
            recipientId = recipient.id;
        }

        const fee = +(amount * (PLATFORM_FEE_PERCENT / 100)).toFixed(2);
        const net = +(amount - fee).toFixed(2);

        return this.dataSource.transaction(async (mgr) => {
            // 1. Debit sender
            const senderBal = await mgr.findOne(CreditBalance, { where: { userId: fromUserId } })
                ?? mgr.create(CreditBalance, { userId: fromUserId, balance: 0 });
            if (Number(senderBal.balance) < amount) {
                throw new BadRequestException('Insufficient credits — top up first');
            }
            const senderAfter = Number(senderBal.balance) - amount;
            senderBal.balance = senderAfter;
            senderBal.lifetimeOut = Number(senderBal.lifetimeOut) + amount;
            await mgr.save(senderBal);

            // 2. Credit recipient with net amount
            const recBal = await mgr.findOne(CreditBalance, { where: { userId: recipientId } })
                ?? mgr.create(CreditBalance, { userId: recipientId, balance: 0 });
            const recAfter = Number(recBal.balance) + net;
            recBal.balance = recAfter;
            recBal.lifetimeIn = Number(recBal.lifetimeIn) + net;
            await mgr.save(recBal);

            // 3. Credit platform with commission (skip if recipient IS the platform)
            let platformAfter = 0;
            if (recipientId !== platformUser.id && fee > 0) {
                const pBal = await mgr.findOne(CreditBalance, { where: { userId: platformUser.id } })
                    ?? mgr.create(CreditBalance, { userId: platformUser.id, balance: 0 });
                platformAfter = Number(pBal.balance) + fee;
                pBal.balance = platformAfter;
                pBal.lifetimeIn = Number(pBal.lifetimeIn) + fee;
                await mgr.save(pBal);
            }

            // 4. Donation row
            const donation = await mgr.save(mgr.create(Donation, {
                fromUserId,
                toUserId: opts.target === DonationTarget.USER ? recipientId : null,
                target: opts.target,
                grossAmount: amount,
                platformFee: fee,
                netAmount: net,
                message: opts.message,
                isAnonymous: !!opts.isAnonymous,
                giftType: opts.giftType || null,
            }));

            // 5. Transactions for audit
            await mgr.save(mgr.create(CreditTransaction, {
                userId: fromUserId,
                kind: CreditTxKind.DONATION_OUT,
                amount: -amount,
                counterpartyId: recipientId,
                note: opts.message || (opts.target === DonationTarget.PLATFORM
                    ? 'Donation to the platform'
                    : 'Donation sent'),
                balanceAfter: senderAfter,
                donationId: donation.id,
            }));
            await mgr.save(mgr.create(CreditTransaction, {
                userId: recipientId,
                kind: CreditTxKind.DONATION_IN,
                amount: net,
                counterpartyId: fromUserId,
                note: opts.isAnonymous ? 'Anonymous donation' : 'Donation received',
                balanceAfter: recAfter,
                donationId: donation.id,
            }));
            if (recipientId !== platformUser.id && fee > 0) {
                await mgr.save(mgr.create(CreditTransaction, {
                    userId: platformUser.id,
                    kind: CreditTxKind.PLATFORM_FEE,
                    amount: fee,
                    counterpartyId: fromUserId,
                    note: `${PLATFORM_FEE_PERCENT}% commission`,
                    balanceAfter: platformAfter,
                    donationId: donation.id,
                }));
            }

            return {
                donation,
                feePercent: PLATFORM_FEE_PERCENT,
                senderBalance: senderAfter,
            };
        }).then(async (result) => {
            // Notify the recipient (user donations only; platform doesn't need a ping)
            if (opts.target === DonationTarget.USER && recipientId !== platformUser.id) {
                try {
                    const sender = opts.isAnonymous
                        ? null
                        : await this.users.findOne({ where: { id: fromUserId } });
                    const fromName = sender?.fullName || 'Someone';
                    await this.notifications.create(
                        recipientId,
                        opts.isAnonymous ? 'You received an anonymous tip' : `${fromName} sent you a tip`,
                        `${net} TND added to your balance${opts.message ? ' — "' + opts.message + '"' : ''}`,
                        NotificationType.DONATION,
                        { fromUserId: opts.isAnonymous ? null : fromUserId, amount: net },
                    );
                } catch {}
            }
            return result;
        });
    }

    /** The virtual-gift catalog (public). */
    listGifts() {
        return GIFT_CATALOG;
    }

    /** Send a virtual gift to a user — a donation priced from the catalog (server-authoritative). */
    async sendGift(fromUserId: string, giftId: string, toUserId: string, isAnonymous = false) {
        const gift = GIFT_CATALOG.find((g) => g.id === giftId);
        if (!gift) throw new BadRequestException('Unknown gift');
        if (!toUserId) throw new BadRequestException('toUserId required');
        return this.donate(fromUserId, {
            target: DonationTarget.USER,
            toUserId,
            amount: gift.price,
            message: `${gift.emoji} ${gift.label}`,
            isAnonymous,
            giftType: gift.id,
        });
    }

    async listSent(userId: string, limit = 25) {
        return this.donations.find({
            where: { fromUserId: userId },
            order: { createdAt: 'DESC' },
            take: Math.min(100, Math.max(1, limit)),
            relations: ['toUser'],
        });
    }

    async listReceived(userId: string, limit = 25) {
        return this.donations.find({
            where: { toUserId: userId, target: DonationTarget.USER },
            order: { createdAt: 'DESC' },
            take: Math.min(100, Math.max(1, limit)),
            relations: ['fromUser'],
        });
    }

    /** Top supporters of the platform + top tipped community members. */
    async leaderboard(limit = 10) {
        const lim = Math.min(50, Math.max(1, limit));

        const topPlatform = await this.dataSource.query(`
            SELECT u.id, u."fullName", u.avatar, SUM(d."grossAmount")::float AS total
            FROM donations d
            JOIN users u ON u.id = d."fromUserId"
            WHERE d.target = 'platform'
            GROUP BY u.id, u."fullName", u.avatar
            ORDER BY total DESC
            LIMIT $1
        `, [lim]);

        const topReceivers = await this.dataSource.query(`
            SELECT u.id, u."fullName", u.avatar, SUM(d."netAmount")::float AS total
            FROM donations d
            JOIN users u ON u.id = d."toUserId"
            WHERE d.target = 'user'
            GROUP BY u.id, u."fullName", u.avatar
            ORDER BY total DESC
            LIMIT $1
        `, [lim]);

        return { topPlatformSupporters: topPlatform, topReceivers };
    }
}
