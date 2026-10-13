import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCategoryDTO {
    @ApiProperty({ maxLength: 80 })
    @IsString()
    @MinLength(1)
    @MaxLength(80)
    name: string;
}
