import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MarketplaceService } from './marketplace.service';
import { ProductCategory } from './product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // ---- Products ----
  @Get('products')
  @ApiOperation({ summary: 'Browse products' })
  findProducts(
    @Query('category') category?: ProductCategory,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.marketplaceService.findProducts({
      category,
      search,
      minPrice,
      maxPrice,
      page,
      limit,
    });
  }

  @Get('products/featured')
  @ApiOperation({ summary: 'Get featured products' })
  getFeatured() {
    return this.marketplaceService.findProducts({ featured: true, limit: 10 });
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product details' })
  findProduct(@Param('id') id: string) {
    return this.marketplaceService.findProductById(id);
  }

  @Post('products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product listing' })
  createProduct(@CurrentUser('id') sellerId: string, @Body() data: CreateProductDto) {
    return this.marketplaceService.createProduct(sellerId, data);
  }

  @Put('products/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product' })
  updateProduct(
    @CurrentUser('id') sellerId: string,
    @Param('id') id: string,
    @Body() data: UpdateProductDto,
  ) {
    return this.marketplaceService.updateProduct(sellerId, id, data);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product' })
  deleteProduct(@CurrentUser('id') sellerId: string, @Param('id') id: string) {
    return this.marketplaceService.deleteProduct(sellerId, id);
  }

  // ---- Orders ----
  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an order' })
  createOrder(
    @CurrentUser('id') buyerId: string,
    @Body()
    body: {
      items: Array<{ productId: string; quantity: number }>;
      shippingAddress: any;
    },
  ) {
    return this.marketplaceService.createOrder(buyerId, body.items, body.shippingAddress);
  }

  @Get('orders/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my orders' })
  getMyOrders(@CurrentUser('id') buyerId: string) {
    return this.marketplaceService.getMyOrders(buyerId);
  }

  @Get('orders/seller')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get orders as seller' })
  getSellerOrders(@CurrentUser('id') sellerId: string) {
    return this.marketplaceService.getSellerOrders(sellerId);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order details' })
  getOrder(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.marketplaceService.getOrder(id, userId);
  }

  // IDOR fix: `getOrder` above checks `order.buyerId !== userId`, but this took
  // no user at all — any logged-in user could change ANY order's status.
  // An order can span multiple sellers, so there is no single-seller check to
  // make here; fulfilment is an operational action, so admin-gate it (nothing
  // in the frontend calls this).
  @Put('orders/:id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status (admin)' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('metadata') metadata?: Record<string, unknown>,
  ) {
    return this.marketplaceService.updateOrderStatus(id, status as any, metadata);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get marketplace statistics' })
  getStats() {
    return this.marketplaceService.getMarketplaceStats();
  }
}
