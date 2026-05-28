"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditsService = exports.GIFT_CATALOG = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const credit_balance_entity_1 = require("./credit-balance.entity");
const credit_transaction_entity_1 = require("./credit-transaction.entity");
const donation_entity_1 = require("./donation.entity");
const referral_reward_entity_1 = require("./referral-reward.entity");
const user_entity_1 = require("../users/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/notification.entity");
const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || 10);
const PLATFORM_USER_EMAIL = process.env.PLATFORM_USER_EMAIL || 'platform@etunisia.tn';
exports.GIFT_CATALOG = [
    { id: 'jasmine', label: 'Jasmine', emoji: '🌼', price: 1 },
    { id: 'mint_tea', label: 'Mint Tea', emoji: '🍵', price: 3 },
    { id: 'dates', label: 'Box of Dates', emoji: '🌴', price: 5 },
    { id: 'carpet', label: 'Kairouan Carpet', emoji: '🧶', price: 15 },
    { id: 'camel', label: 'Camel', emoji: '🐪', price: 50 },
];
let CreditsService = class CreditsService {
    constructor(balances, txs, donations, referrals, users, dataSource, notifications) {
        this.balances = balances;
        this.txs = txs;
        this.donations = donations;
        this.referrals = referrals;
        this.users = users;
        this.dataSource = dataSource;
        this.notifications = notifications;
    }
    async ensureBalance(userId) {
        let bal = await this.balances.findOne({ where: { userId } });
        if (!bal) {
            bal = await this.balances.save(this.balances.create({ userId, balance: 0 }));
        }
        return bal;
    }
    async ensurePlatformUser() {
        let user = await this.users.findOne({ where: { email: PLATFORM_USER_EMAIL } });
        if (!user) {
            const created = this.users.create({
                fullName: 'e-Tunisia Platform',
                email: PLATFORM_USER_EMAIL,
                password: 'platform-account-no-login',
                role: 'admin',
            });
            user = (await this.users.save(created));
        }
        await this.ensureBalance(user.id);
        return user;
    }
    async getBalance(userId) {
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
    async creditInTx(mgr, userId, amount, kind, note, counterpartyId) {
        const bal = await mgr.findOne(credit_balance_entity_1.CreditBalance, { where: { userId } })
            ?? mgr.create(credit_balance_entity_1.CreditBalance, { userId, balance: 0 });
        const after = Number(bal.balance) + amount;
        bal.balance = after;
        bal.lifetimeIn = Number(bal.lifetimeIn) + amount;
        await mgr.save(bal);
        await mgr.save(mgr.create(credit_transaction_entity_1.CreditTransaction, { userId, kind, amount, counterpartyId, note, balanceAfter: after }));
    }
    async createPendingReferral(refereeId, referrerId) {
        const reward = Number(process.env.REFERRAL_REWARD_TND || 10);
        if (reward <= 0 || refereeId === referrerId)
            return;
        try {
            await this.referrals.save(this.referrals.create({ refereeId, referrerId, status: 'pending', amount: reward }));
        }
        catch {
            return;
        }
        await this.dataSource.transaction(async (mgr) => {
            await this.creditInTx(mgr, refereeId, reward, credit_transaction_entity_1.CreditTxKind.REFERRAL, 'Welcome bonus — joined via a referral', referrerId);
        });
    }
    async releasePendingReferralForReferee(refereeId) {
        const maxRewards = Number(process.env.REFERRAL_MAX_REWARDS || 100);
        let releasedTo = null;
        await this.dataSource.transaction(async (mgr) => {
            const reward = await mgr.findOne(referral_reward_entity_1.ReferralReward, { where: { refereeId, status: 'pending' } });
            if (!reward)
                return;
            const alreadyReleased = await mgr.count(referral_reward_entity_1.ReferralReward, { where: { referrerId: reward.referrerId, status: 'released' } });
            reward.status = 'released';
            reward.releasedAt = new Date();
            if (alreadyReleased >= maxRewards) {
                reward.amount = 0;
            }
            else {
                await this.creditInTx(mgr, reward.referrerId, Number(reward.amount), credit_transaction_entity_1.CreditTxKind.REFERRAL, 'Referral reward — your friend got started', refereeId);
                releasedTo = { referrerId: reward.referrerId, amount: Number(reward.amount) };
            }
            await mgr.save(reward);
        });
        if (releasedTo) {
            try {
                await this.notifications.create(releasedTo.referrerId, 'Referral reward unlocked', `${releasedTo.amount} TND credit added — your friend got started.`, notification_entity_1.NotificationType.DONATION, { amount: releasedTo.amount });
            }
            catch { }
        }
    }
    async referralStats(userId) {
        const [released, pending] = await Promise.all([
            this.referrals.count({ where: { referrerId: userId, status: 'released' } }),
            this.referrals.count({ where: { referrerId: userId, status: 'pending' } }),
        ]);
        return { released, pending, rewardTnd: Number(process.env.REFERRAL_REWARD_TND || 10) };
    }
    async deposit(userId, amount, note) {
        if (amount <= 0)
            throw new common_1.BadRequestException('Amount must be > 0');
        if (amount > 5000)
            throw new common_1.BadRequestException('Single top-up capped at 5000 TND');
        const tx = await this.dataSource.transaction(async (mgr) => {
            const bal = await mgr.findOne(credit_balance_entity_1.CreditBalance, { where: { userId } })
                ?? mgr.create(credit_balance_entity_1.CreditBalance, { userId, balance: 0 });
            const newBalance = Number(bal.balance) + amount;
            bal.balance = newBalance;
            bal.lifetimeIn = Number(bal.lifetimeIn) + amount;
            await mgr.save(bal);
            const txRow = mgr.create(credit_transaction_entity_1.CreditTransaction, {
                userId,
                kind: credit_transaction_entity_1.CreditTxKind.DEPOSIT,
                amount,
                note: note || `Top-up of ${amount} TND`,
                balanceAfter: newBalance,
            });
            return mgr.save(txRow);
        });
        try {
            await this.releasePendingReferralForReferee(userId);
        }
        catch { }
        return tx;
    }
    async chargeBoost(payerUserId, amount, note, placeId) {
        if (amount <= 0)
            throw new common_1.BadRequestException('Boost amount must be > 0');
        const platform = await this.ensurePlatformUser();
        return this.dataSource.transaction(async (mgr) => {
            const bal = await mgr.findOne(credit_balance_entity_1.CreditBalance, { where: { userId: payerUserId } });
            const current = Number(bal?.balance || 0);
            if (current < amount)
                throw new common_1.BadRequestException('Insufficient credits — top up to boost');
            const newBalance = current - amount;
            bal.balance = newBalance;
            bal.lifetimeOut = Number(bal.lifetimeOut) + amount;
            await mgr.save(bal);
            await mgr.save(mgr.create(credit_transaction_entity_1.CreditTransaction, {
                userId: payerUserId,
                kind: credit_transaction_entity_1.CreditTxKind.BOOST,
                amount: -amount,
                counterpartyId: platform.id,
                note,
                balanceAfter: newBalance,
                donationId: placeId,
            }));
            const platBal = await mgr.findOne(credit_balance_entity_1.CreditBalance, { where: { userId: platform.id } })
                ?? mgr.create(credit_balance_entity_1.CreditBalance, { userId: platform.id, balance: 0 });
            const platNew = Number(platBal.balance || 0) + amount;
            platBal.balance = platNew;
            platBal.lifetimeIn = Number(platBal.lifetimeIn || 0) + amount;
            await mgr.save(platBal);
            await mgr.save(mgr.create(credit_transaction_entity_1.CreditTransaction, {
                userId: platform.id,
                kind: credit_transaction_entity_1.CreditTxKind.BOOST,
                amount,
                counterpartyId: payerUserId,
                note: `Boost revenue: ${note}`,
                balanceAfter: platNew,
                donationId: placeId,
            }));
            return { balance: newBalance, charged: amount };
        });
    }
    async donate(fromUserId, opts) {
        const amount = Number(opts.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new common_1.BadRequestException('Amount must be > 0');
        }
        if (amount > 5000)
            throw new common_1.BadRequestException('Single donation capped at 5000 TND');
        const platformUser = await this.ensurePlatformUser();
        let recipientId;
        if (opts.target === donation_entity_1.DonationTarget.PLATFORM) {
            recipientId = platformUser.id;
        }
        else {
            if (!opts.toUserId)
                throw new common_1.BadRequestException('toUserId required');
            if (opts.toUserId === fromUserId)
                throw new common_1.BadRequestException('Cannot donate to yourself');
            const recipient = await this.users.findOne({ where: { id: opts.toUserId } });
            if (!recipient)
                throw new common_1.NotFoundException('Recipient user not found');
            recipientId = recipient.id;
        }
        const fee = +(amount * (PLATFORM_FEE_PERCENT / 100)).toFixed(2);
        const net = +(amount - fee).toFixed(2);
        return this.dataSource.transaction(async (mgr) => {
            const senderBal = await mgr.findOne(credit_balance_entity_1.CreditBalance, { where: { userId: fromUserId } })
                ?? mgr.create(credit_balance_entity_1.CreditBalance, { userId: fromUserId, balance: 0 });
            if (Number(senderBal.balance) < amount) {
                throw new common_1.BadRequestException('Insufficient credits — top up first');
            }
            const senderAfter = Number(senderBal.balance) - amount;
            senderBal.balance = senderAfter;
            senderBal.lifetimeOut = Number(senderBal.lifetimeOut) + amount;
            await mgr.save(senderBal);
            const recBal = await mgr.findOne(credit_balance_entity_1.CreditBalance, { where: { userId: recipientId } })
                ?? mgr.create(credit_balance_entity_1.CreditBalance, { userId: recipientId, balance: 0 });
            const recAfter = Number(recBal.balance) + net;
            recBal.balance = recAfter;
            recBal.lifetimeIn = Number(recBal.lifetimeIn) + net;
            await mgr.save(recBal);
            let platformAfter = 0;
            if (recipientId !== platformUser.id && fee > 0) {
                const pBal = await mgr.findOne(credit_balance_entity_1.CreditBalance, { where: { userId: platformUser.id } })
                    ?? mgr.create(credit_balance_entity_1.CreditBalance, { userId: platformUser.id, balance: 0 });
                platformAfter = Number(pBal.balance) + fee;
                pBal.balance = platformAfter;
                pBal.lifetimeIn = Number(pBal.lifetimeIn) + fee;
                await mgr.save(pBal);
            }
            const donation = await mgr.save(mgr.create(donation_entity_1.Donation, {
                fromUserId,
                toUserId: opts.target === donation_entity_1.DonationTarget.USER ? recipientId : null,
                target: opts.target,
                grossAmount: amount,
                platformFee: fee,
                netAmount: net,
                message: opts.message,
                isAnonymous: !!opts.isAnonymous,
                giftType: opts.giftType || null,
            }));
            await mgr.save(mgr.create(credit_transaction_entity_1.CreditTransaction, {
                userId: fromUserId,
                kind: credit_transaction_entity_1.CreditTxKind.DONATION_OUT,
                amount: -amount,
                counterpartyId: recipientId,
                note: opts.message || (opts.target === donation_entity_1.DonationTarget.PLATFORM
                    ? 'Donation to the platform'
                    : 'Donation sent'),
                balanceAfter: senderAfter,
                donationId: donation.id,
            }));
            await mgr.save(mgr.create(credit_transaction_entity_1.CreditTransaction, {
                userId: recipientId,
                kind: credit_transaction_entity_1.CreditTxKind.DONATION_IN,
                amount: net,
                counterpartyId: fromUserId,
                note: opts.isAnonymous ? 'Anonymous donation' : 'Donation received',
                balanceAfter: recAfter,
                donationId: donation.id,
            }));
            if (recipientId !== platformUser.id && fee > 0) {
                await mgr.save(mgr.create(credit_transaction_entity_1.CreditTransaction, {
                    userId: platformUser.id,
                    kind: credit_transaction_entity_1.CreditTxKind.PLATFORM_FEE,
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
            if (opts.target === donation_entity_1.DonationTarget.USER && recipientId !== platformUser.id) {
                try {
                    const sender = opts.isAnonymous
                        ? null
                        : await this.users.findOne({ where: { id: fromUserId } });
                    const fromName = sender?.fullName || 'Someone';
                    await this.notifications.create(recipientId, opts.isAnonymous ? 'You received an anonymous tip' : `${fromName} sent you a tip`, `${net} TND added to your balance${opts.message ? ' — "' + opts.message + '"' : ''}`, notification_entity_1.NotificationType.DONATION, { fromUserId: opts.isAnonymous ? null : fromUserId, amount: net });
                }
                catch { }
            }
            return result;
        });
    }
    listGifts() {
        return exports.GIFT_CATALOG;
    }
    async sendGift(fromUserId, giftId, toUserId, isAnonymous = false) {
        const gift = exports.GIFT_CATALOG.find((g) => g.id === giftId);
        if (!gift)
            throw new common_1.BadRequestException('Unknown gift');
        if (!toUserId)
            throw new common_1.BadRequestException('toUserId required');
        return this.donate(fromUserId, {
            target: donation_entity_1.DonationTarget.USER,
            toUserId,
            amount: gift.price,
            message: `${gift.emoji} ${gift.label}`,
            isAnonymous,
            giftType: gift.id,
        });
    }
    async listSent(userId, limit = 25) {
        return this.donations.find({
            where: { fromUserId: userId },
            order: { createdAt: 'DESC' },
            take: Math.min(100, Math.max(1, limit)),
            relations: ['toUser'],
        });
    }
    async listReceived(userId, limit = 25) {
        return this.donations.find({
            where: { toUserId: userId, target: donation_entity_1.DonationTarget.USER },
            order: { createdAt: 'DESC' },
            take: Math.min(100, Math.max(1, limit)),
            relations: ['fromUser'],
        });
    }
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
};
exports.CreditsService = CreditsService;
exports.CreditsService = CreditsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(credit_balance_entity_1.CreditBalance)),
    __param(1, (0, typeorm_1.InjectRepository)(credit_transaction_entity_1.CreditTransaction)),
    __param(2, (0, typeorm_1.InjectRepository)(donation_entity_1.Donation)),
    __param(3, (0, typeorm_1.InjectRepository)(referral_reward_entity_1.ReferralReward)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        notifications_service_1.NotificationsService])
], CreditsService);
//# sourceMappingURL=credits.service.js.map