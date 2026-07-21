import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ItineraryDayDto {
  @IsInt()
  @Min(1)
  day: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  placeIds?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Declares the ONLY fields a client may set when creating an itinerary.
 *
 * The controller previously took `@Body() body: any` and the service did
 * `repo.create({ ...data, authorId })`, so a user could set `isPremium: true`
 * plus fake `likeCount`/`viewCount` — which feed ranking reads. Those columns
 * are deliberately omitted so the global ValidationPipe rejects them.
 */
export class CreateItineraryDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryDayDto)
  @IsOptional()
  days?: ItineraryDayDto[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  placeIds?: string[];

  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  duration?: number;

  @IsIn(['easy', 'moderate', 'challenging'])
  @IsOptional()
  difficulty?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
