import { IsEmail, IsString, MinLength, IsOptional, Matches, MaxLength } from 'class-validator';
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

    @ApiProperty({
        example: 'ahmed_t',
        required: false,
        description: 'Optional public handle. If omitted, auto-generated from fullName. 3-30 chars, [a-z0-9_], must start with a letter.',
    })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    @Matches(/^[a-z][a-z0-9_]{2,29}$/)
    handle?: string;

    @ApiProperty({ example: 'Tunisia', required: false })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiProperty({ example: '+216 12 345 678', required: false })
    @IsOptional()
    @IsString()
    phone?: string;
}
