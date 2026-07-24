import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

const ITEM_TYPES = ['room', 'tour_slot', 'experience_slot', 'table', 'ticket'] as const;

/**
 * Fields a host/admin may set on an inventory item.
 *
 * These endpoints are admin-gated and the entity has no privilege columns
 * (no rating/isFeatured/owner), so unlike the collection/product DTOs this is
 * type-validation robustness rather than a mass-assignment exploit fix — but it
 * closes the last `@Body() any` on a write path so the global ValidationPipe
 * actually runs (inline/any-typed bodies bypass it entirely).
 *
 * `availability`/`blockedDates` are validated only as arrays of objects here to
 * avoid over-constraining the existing simple-json shape; tighten later if the
 * rules stabilise.
 */
export class CreateInventoryItemDto {
  @IsUUID()
  placeId: string;

  @IsIn(ITEM_TYPES as unknown as string[])
  type: (typeof ITEM_TYPES)[number];

  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsArray()
  @IsOptional()
  availability?: any[];

  @IsArray()
  @IsOptional()
  blockedDates?: any[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  minAdvanceBookingHours?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxAdvanceBookingDays?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  minQuantity?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxQuantity?: number;
}

/** Same allow-list, everything optional — for PUT updates. */
export class UpdateInventoryItemDto {
  @IsIn(ITEM_TYPES as unknown as string[])
  @IsOptional()
  type?: (typeof ITEM_TYPES)[number];

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

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsArray()
  @IsOptional()
  availability?: any[];

  @IsArray()
  @IsOptional()
  blockedDates?: any[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  minAdvanceBookingHours?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxAdvanceBookingDays?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  minQuantity?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxQuantity?: number;
}
