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
exports.MarketplaceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./product.entity");
const order_entity_1 = require("./order.entity");
let MarketplaceService = class MarketplaceService {
    constructor(productRepo, orderRepo) {
        this.productRepo = productRepo;
        this.orderRepo = orderRepo;
    }
    async createProduct(sellerId, data) {
        const product = this.productRepo.create({
            ...data,
            sellerId,
        });
        return this.productRepo.save(product);
    }
    async findProducts(filters) {
        const qb = this.productRepo.createQueryBuilder('product')
            .leftJoinAndSelect('product.seller', 'seller')
            .where('product.isActive = true');
        if (filters.category) {
            qb.andWhere('product.category = :category', { category: filters.category });
        }
        if (filters.sellerId) {
            qb.andWhere('product.sellerId = :sellerId', { sellerId: filters.sellerId });
        }
        if (filters.minPrice) {
            qb.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
        }
        if (filters.maxPrice) {
            qb.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
        }
        if (filters.featured) {
            qb.andWhere('product.isFeatured = true');
        }
        if (filters.search) {
            qb.andWhere('(product.name ILIKE :search OR product.description ILIKE :search)', { search: `%${filters.search}%` });
        }
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const [data, total] = await qb
            .orderBy('product.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findProductById(id) {
        const product = await this.productRepo.findOne({
            where: { id, isActive: true },
            relations: ['seller'],
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
    async updateProduct(sellerId, productId, data) {
        const product = await this.productRepo.findOne({
            where: { id: productId, sellerId },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        Object.assign(product, data);
        return this.productRepo.save(product);
    }
    async deleteProduct(sellerId, productId) {
        const product = await this.productRepo.findOne({
            where: { id: productId, sellerId },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        product.isActive = false;
        await this.productRepo.save(product);
    }
    async createOrder(buyerId, items, shippingAddress) {
        if (!items || items.length === 0) {
            throw new common_1.BadRequestException('Cart is empty');
        }
        const productIds = items.map((i) => i.productId);
        const products = await this.productRepo.findByIds(productIds);
        if (products.length !== items.length) {
            throw new common_1.NotFoundException('Some products not found');
        }
        let subtotal = 0;
        const orderItems = items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (product.stock < item.quantity) {
                throw new common_1.BadRequestException(`Insufficient stock for ${product.name}`);
            }
            const total = Number(product.price) * item.quantity;
            subtotal += total;
            product.stock -= item.quantity;
            return {
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: Number(product.price),
                total,
                image: product.images?.[0],
            };
        });
        const platformFee = Math.round(subtotal * 0.08 * 100) / 100;
        const shippingCost = subtotal > 200 ? 0 : 15;
        const sellerPayout = subtotal - platformFee;
        const total = subtotal + shippingCost;
        await this.productRepo.save(products);
        const order = this.orderRepo.create({
            buyerId,
            items: orderItems,
            subtotal,
            shippingCost,
            platformFee,
            sellerPayout,
            total,
            status: order_entity_1.OrderStatus.PENDING,
            shippingAddress,
        });
        return this.orderRepo.save(order);
    }
    async getMyOrders(buyerId) {
        return this.orderRepo.find({
            where: { buyerId },
            order: { createdAt: 'DESC' },
        });
    }
    async getSellerOrders(sellerId) {
        const allOrders = await this.orderRepo.find({
            order: { createdAt: 'DESC' },
        });
        return allOrders;
    }
    async getOrder(orderId, userId) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.buyerId !== userId) {
            throw new common_1.BadRequestException('Not authorized');
        }
        return order;
    }
    async updateOrderStatus(orderId, status, metadata) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        order.status = status;
        if (metadata) {
            order.metadata = { ...order.metadata, ...metadata };
        }
        return this.orderRepo.save(order);
    }
    async getMarketplaceStats() {
        const [products, orders] = await Promise.all([
            this.productRepo.count({ where: { isActive: true } }),
            this.orderRepo.count(),
        ]);
        const revenue = await this.orderRepo
            .createQueryBuilder('order')
            .select('SUM(order.total)', 'total')
            .where('order.status IN (:...statuses)', {
            statuses: [order_entity_1.OrderStatus.PAID, order_entity_1.OrderStatus.SHIPPED, order_entity_1.OrderStatus.DELIVERED],
        })
            .getRawOne();
        const fees = await this.orderRepo
            .createQueryBuilder('order')
            .select('SUM(order.platformFee)', 'total')
            .where('order.status IN (:...statuses)', {
            statuses: [order_entity_1.OrderStatus.PAID, order_entity_1.OrderStatus.SHIPPED, order_entity_1.OrderStatus.DELIVERED],
        })
            .getRawOne();
        return {
            totalProducts: products,
            totalOrders: orders,
            totalRevenue: Number(revenue?.total) || 0,
            totalPlatformFees: Number(fees?.total) || 0,
        };
    }
};
exports.MarketplaceService = MarketplaceService;
exports.MarketplaceService = MarketplaceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], MarketplaceService);
//# sourceMappingURL=marketplace.service.js.map