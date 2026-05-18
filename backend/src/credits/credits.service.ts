import {
    Injectable, BadRequestException, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, Not } from 'typeorm';
import { CreditBalance } from './credit-balance.entity';
import { CreditTransaction, CreditTxKind } from './credit-transaction.entity';
import { Donation, DonationTarget } from './donation.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || 10); // 10 % commission
const PLATFORM_USER_EMAIL = process.env.PLATFORM_USER_EMAIL || 'platform@etunisia.tn';

@Injectable()
export class CreditsService {
    constructor(
        @InjectRepository(CreditBalance) private balances: Repository<CreditBalance>,
        @InjectRepository(CreditTransaction) private txs: Repository<CreditTransaction>,
        @InjectRepository(Donation) private donations: Repository<Donation>,
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

    /** Mock top-up — no real payment gateway yet, just adds the amount. */
    async deposit(userId: string, amount: number, note?: string) {
        if (amount <= 0) throw new BadRequestException('Amount must be > 0');
        if (amount > 5000) throw new BadRequestException('Single top-up capped at 5000 TND');
        return this.dataSource.transaction(async (mgr) => {
            const bal = await mgr.findOne(CreditBalance, { where: { userId } })
                ?? mgr.create(CreditBalance, { userId, balance: 0 });
            const newBalance = Number(bal.balance) + amount;
            bal.balance = newBalance;
            bal.lifetimeIn = Number(bal.lifetimeIn) + amount;
            await mgr.save(bal);

            const tx = mgr.create(CreditTransaction, {
                userId,
                kind: CreditTxKind.DEPOSIT,
                amount,
                note: note || `Top-up of ${amount} TND`,
                balanceAfter: newBalance,
            });
            return mgr.save(tx);
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
