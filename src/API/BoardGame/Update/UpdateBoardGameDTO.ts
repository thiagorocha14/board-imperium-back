import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    ArrayUnique,
    IsArray,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    IsUUID,
    Matches,
    Max,
    MaxLength,
    Min,
    MinLength,
    Validate,
    ValidateIf,
} from 'class-validator';
import { GAME_IMAGE_URL_MAX } from '../../../Domain/BoardGame/GameImage.js';
import { LEVEL_MAX, LEVEL_MIN } from '../../../Domain/BoardGame/Level.js';
import { PURCHASE_DATE_PATTERN } from '../../../Domain/BoardGame/PurchaseDate.js';
import { PlayerRangeConstraint } from '../PlayerRangeConstraint.js';

export class UpdateBoardGameDTO {
    @ApiPropertyOptional({ maxLength: 150 })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(150)
    name?: string;

    @ApiPropertyOptional({ minimum: LEVEL_MIN, maximum: LEVEL_MAX, example: 3 })
    @ValidateIf((_, value) => value !== undefined)
    @IsInt()
    @Min(LEVEL_MIN)
    @Max(LEVEL_MAX)
    level?: number;

    @ApiPropertyOptional({ minimum: 1, maximum: 5 })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(1)
    @Max(5)
    complexity?: number;

    @ApiPropertyOptional({ minimum: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    playTimeMinutes?: number;

    @ApiPropertyOptional({ minimum: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    minPlayers?: number;

    @ApiPropertyOptional({ minimum: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Validate(PlayerRangeConstraint)
    maxPlayers?: number;

    @ApiPropertyOptional({ example: '2024-05-01', nullable: true })
    @IsOptional()
    @IsString()
    @Matches(PURCHASE_DATE_PATTERN)
    purchasedAt?: string | null;

    @ApiPropertyOptional({ nullable: true, maxLength: GAME_IMAGE_URL_MAX })
    @IsOptional()
    @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
    @MaxLength(GAME_IMAGE_URL_MAX)
    imageUrl?: string | null;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsUUID('all', { each: true })
    categoryIds?: string[];

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsUUID('all', { each: true })
    mechanicIds?: string[];
}
