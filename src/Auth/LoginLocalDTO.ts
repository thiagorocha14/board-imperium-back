import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, Validate } from 'class-validator';
import { normalizeEmailShape } from '../Domain/User/Email.js';
import { PasswordPolicyConstraint } from './PasswordPolicyConstraint.js';

export class LoginLocalDTO {
    @ApiProperty({ example: 'ada@example.com', maxLength: 320 })
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? normalizeEmailShape(value) : value,
    )
    @IsEmail()
    @MaxLength(320)
    email: string;

    @ApiProperty({
        format: 'password',
        minLength: 8,
        maxLength: 128,
        writeOnly: true,
        description:
            'Between 8 and 128 characters. The value is compared exactly as submitted.',
    })
    @IsString()
    @Validate(PasswordPolicyConstraint)
    password: string;
}
