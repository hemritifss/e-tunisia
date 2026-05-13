import {
  IsUUID,
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class BookingGuestDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsNumber()
  @IsOptional()
  age?: number;
}

class BookingAddonDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateBookingDto {
  @IsUUID()
  placeId: string;

  @IsUUID()
  itemId: string;

  @IsEnum(['hotel', 'tour', 'experience', 'event', 'restaurant'])
  type: 'hotel' | 'tour' | 'experience' | 'event' | 'restaurant';

  @IsDateString()
  checkIn: string;

  @IsDateString()
  @IsOptional()
  checkOut?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsNumber()
  @Min(1)
  @Max(50)
  guests: number;

  @ValidateNested({ each: true })
  @Type(() => BookingGuestDto)
  @IsOptional()
  guestDetails?: BookingGuestDto[];

  @ValidateNested({ each: true })
  @Type(() => BookingAddonDto)
  @IsOptional()
  addons?: BookingAddonDto[];

  @IsString()
  @IsOptional()
  specialRequests?: string;
}
