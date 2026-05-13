import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductCategory } from './product.entity';
import { Order, OrderStatus } from './order.entity';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  // ---- Products ----
  async createProduct(sellerId: string, data: Partial<Product>): Promise<Product> {
    const product = this.productRepo.create({
      ...data,
      sellerId,
    });
    return this.productRepo.save(product);
  }

  async findProducts(filters: {
    category?: ProductCategory;
    sellerId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: Product[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
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
      qb.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
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

  async findProductById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, isActive: true },
      relations: ['seller'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(sellerId: string, productId: string, data: Partial<Product>): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id: productId, sellerId },
    });
    if (!product) throw new NotFoundException('Product not found');

    Object.assign(product, data);
    return this.productRepo.save(product);
  }

  async deleteProduct(sellerId: string, productId: string): Promise<void> {
    const product = await this.productRepo.findOne({
      where: { id: productId, sellerId },
    });
    if (!product) throw new NotFoundException('Product not found');

    product.isActive = false;
    await this.productRepo.save(product);
  }

  // ---- Orders ----
  async createOrder(
    buyerId: string,
    items: Array<{ productId: string; quantity: number }>,
    shippingAddress: Order['shippingAddress'],
  ): Promise<Order> {
    if (!items || items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Fetch all products
    const productIds = items.map((i) => i.productId);
    const products = await this.productRepo.findByIds(productIds);

    if (products.length !== items.length) {
      throw new NotFoundException('Some products not found');
    }

    // Validate stock and calculate totals
    let subtotal = 0;
    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }

      const total = Number(product.price) * item.quantity;
      subtotal += total;

      // Reduce stock
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

    // Calculate fees
    const platformFee = Math.round(subtotal * 0.08 * 100) / 100; // 8% commission
    const shippingCost = subtotal > 200 ? 0 : 15; // Free shipping over 200 TND
    const sellerPayout = subtotal - platformFee;
    const total = subtotal + shippingCost;

    // Save updated product stocks
    await this.productRepo.save(products);

    const order = this.orderRepo.create({
      buyerId,
      items: orderItems,
      subtotal,
      shippingCost,
      platformFee,
      sellerPayout,
      total,
      status: OrderStatus.PENDING,
      shippingAddress,
    });

    return this.orderRepo.save(order);
  }

  async getMyOrders(buyerId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { buyerId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSellerOrders(sellerId: string): Promise<Order[]> {
    // Find orders containing products from this seller
    const allOrders = await this.orderRepo.find({
      order: { createdAt: 'DESC' },
    });

    // Filter orders that contain products from this seller
    // In production, add sellerId to order items
    return allOrders;
  }

  async getOrder(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.buyerId !== userId) {
      throw new BadRequestException('Not authorized');
    }
    return order;
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    metadata?: Record<string, unknown>,
  ): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    order.status = status;
    if (metadata) {
      order.metadata = { ...order.metadata, ...metadata };
    }

    return this.orderRepo.save(order);
  }

  async getMarketplaceStats(): Promise<{
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalPlatformFees: number;
  }> {
    const [products, orders] = await Promise.all([
      this.productRepo.count({ where: { isActive: true } }),
      this.orderRepo.count(),
    ]);

    const revenue = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
      })
      .getRawOne();

    const fees = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.platformFee)', 'total')
      .where('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
      })
      .getRawOne();

    return {
      totalProducts: products,
      totalOrders: orders,
      totalRevenue: Number(revenue?.total) || 0,
      totalPlatformFees: Number(fees?.total) || 0,
    };
  }
}
