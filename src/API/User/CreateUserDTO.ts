import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
} from 'class-validator';

export class CreateUserDTO {
    @ApiProperty({ example: 'ada@example.com' })
    @IsEmail()
    @MaxLength(320)
    email: string;

    @ApiProperty({ example: 'Ada Lovelace' })
    @IsString()
    @MaxLength(120)
    displayName: string;

    @ApiPropertyOptional({ nullable: true })
    @IsOptional()
    @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
    @MaxLength(2048)
    avatarUrl?: string | null;
}
