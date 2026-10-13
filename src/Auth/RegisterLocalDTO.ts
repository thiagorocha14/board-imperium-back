import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, Validate } from 'class-validator';
import { normalizeEmailShape } from '../Domain/User/Email.js';
import { PasswordPolicyConstraint } from './PasswordPolicyConstraint.js';

export class RegisterLocalDTO {
    @ApiProperty({ example: 'ada@example.com', maxLength: 320 })
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? normalizeEmailShape(value) : value,
    )
    @IsEmail()
    @MaxLength(320)
    email: string;

    @ApiProperty({ example: 'Ada Lovelace', maxLength: 120 })
    @IsString()
    @MaxLength(120)
    displayName: string;

    @ApiProperty({
        format: 'password',
        minLength: 8,
        maxLength: 128,
        writeOnly: true,
        description:
            'Between 8 and 128 characters. Internal spaces are preserved. Blank passwords are rejected.',
    })
    @IsString()
    @Validate(PasswordPolicyConstraint)
    password: string;
}
