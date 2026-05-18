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
exports.CreditsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const credit_balance_entity_1 = require("./credit-balance.entity");
const credit_transaction_entity_1 = require("./credit-transaction.entity");
const donation_entity_1 = require("./donation.entity");
const user_entity_1 = require("../users/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/notification.entity");
const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || 10);
const PLATFORM_USER_EMAIL = process.env.PLATFORM_USER_EMAIL || 'platform@etunisia.tn';
let CreditsService = class CreditsService {
    constructor(balances, txs, donations, users, dataSource, notifications) {
        this.balances = balances;
        this.txs = txs;
        this.donations = donations;
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
    async deposit(userId, amount, note) {
        if (amount <= 0)
            throw new common_1.BadRequestException('Amount must be > 0');
        if (amount > 5000)
            throw new common_1.BadRequestException('Single top-up capped at 5000 TND');
        return this.dataSource.transaction(async (mgr) => {
            const bal = await mgr.findOne(credit_balance_entity_1.CreditBalance, { where: { userId } })
                ?? mgr.create(credit_balance_entity_1.CreditBalance, { userId, balance: 0 });
            const newBalance = Number(bal.balance) + amount;
            bal.balance = newBalance;
            bal.lifetimeIn = Number(bal.lifetimeIn) + amount;
            await mgr.save(bal);
            const tx = mgr.create(credit_transaction_entity_1.CreditTransaction, {
                userId,
                kind: credit_transaction_entity_1.CreditTxKind.DEPOSIT,
                amount,
                note: note || `Top-up of ${amount} TND`,
                balanceAfter: newBalance,
            });
            return mgr.save(tx);
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
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        notifications_service_1.NotificationsService])
], CreditsService);
//# sourceMappingURL=credits.service.js.map