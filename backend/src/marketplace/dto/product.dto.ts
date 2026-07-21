import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCategory } from '../product.entity';

class ShippingOptionDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  estimatedDays: number;
}

/**
 * The ONLY fields a seller may set on a product.
 *
 * Both createProduct (`repo.create({ ...data, sellerId })`) and updateProduct
 * (`Object.assign(product, data)`) previously took `@Body() data: any`, so a
 * seller could publish a listing with `rating: 5`, `reviewCount: 999` and
 * `isFeatured: true` — fabricated commerce trust signals. Those columns are
 * deliberately omitted, so the global ValidationPipe (whitelist +
 * forbidNonWhitelisted) rejects any request that tries to set them.
 * `sellerId` stays server-supplied.
 */
export class CreateProductDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingOptionDto)
  @IsOptional()
  shippingOptions?: ShippingOptionDto[];

  @IsObject()
  @IsOptional()
  attributes?: Record<string, string>;

  /** A seller may unlist their own product; rating/reviewCount/isFeatured stay server-owned. */
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/** Same allow-list as create, with every field optional. */
export class UpdateProductDto {
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(ProductCategory)
  @IsOptional()
  category?: ProductCategory;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingOptionDto)
  @IsOptional()
  shippingOptions?: ShippingOptionDto[];

  @IsObject()
  @IsOptional()
  attributes?: Record<string, string>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
