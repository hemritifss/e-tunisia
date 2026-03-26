import {
    IsString,
    IsNumber,
    IsOptional,
    IsArray,
    IsBoolean,
    IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlaceDto {
    @ApiProperty() @IsString() name: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() nameAr?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() nameFr?: string;
    @ApiProperty() @IsString() description: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() descriptionAr?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() descriptionFr?: string;
    @ApiProperty() @IsString() address: string;
    @ApiProperty() @IsString() city: string;
    @ApiProperty() @IsString() governorate: string;
    @ApiProperty() @IsNumber() latitude: number;
    @ApiProperty() @IsNumber() longitude: number;
    @ApiProperty({ required: false }) @IsOptional() @IsArray() images?: string[];
    @ApiProperty({ required: false }) @IsOptional() @IsString() coverImage?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() videoUrl?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() website?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() openingHours?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() priceRange?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsArray() tags?: string[];
    @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isFeatured?: boolean;
    @ApiProperty() @IsUUID() categoryId: string;
}