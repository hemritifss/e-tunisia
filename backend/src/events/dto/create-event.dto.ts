import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Declares the ONLY fields a client may set when creating an event.
 *
 * The controller previously took `@Body() body: any` and the service did
 * `repo.create({ ...data, organizerId })`, leaving every other column
 * client-settable — notably `attendeeCount`, which could be seeded to a fake
 * number. `attendeeCount` and `isActive` are deliberately absent here so the
 * global ValidationPipe (whitelist + forbidNonWhitelisted) rejects them.
 */
export class CreateEventDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsUUID()
  @IsOptional()
  placeId?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsIn(['culture', 'music', 'food', 'sport', 'festival', 'workshop'])
  @IsOptional()
  category?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @IsString()
  @IsOptional()
  location?: string;
}
