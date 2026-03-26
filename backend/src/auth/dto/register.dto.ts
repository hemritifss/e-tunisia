import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'Ahmed Ben Ali' })
    @IsString()
    fullName: string;

    @ApiProperty({ example: 'ahmed@email.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'Tunisia', required: false })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiProperty({ example: '+216 12 345 678', required: false })
    @IsOptional()
    @IsString()
    phone?: string;
}