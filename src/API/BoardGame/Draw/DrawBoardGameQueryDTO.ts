import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { LEVEL_MAX, LEVEL_MIN } from '../../../Domain/BoardGame/Level.js';

export class DrawBoardGameQueryDTO {
    @ApiPropertyOptional({ minimum: LEVEL_MIN, maximum: LEVEL_MAX, example: 3 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(LEVEL_MIN)
    @Max(LEVEL_MAX)
    level?: number;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsOptional()
    @IsUUID('all')
    categoryId?: string;

    @ApiPropertyOptional({ format: 'uuid' })
    @IsOptional()
    @IsUUID('all')
    mechanicId?: string;
}
