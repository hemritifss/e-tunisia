import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryPlacesDto {
    @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() governorate?: string;
    @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() minRating?: number;
    @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsNumber() page?: number = 1;
    @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsNumber() limit?: number = 20;
    @ApiPropertyOptional() @IsOptional() @IsString() sortBy?: string = 'createdAt';
    @ApiPropertyOptional() @IsOptional() @IsString() order?: 'ASC' | 'DESC' = 'DESC';
    @ApiPropertyOptional() @IsOptional() @IsString() featured?: string;
}