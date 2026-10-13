import {
    ValidatorConstraint,
    type ValidatorConstraintInterface,
} from 'class-validator';
import {
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    isPasswordAcceptable,
} from '../Domain/Auth/PasswordPolicy.js';

@ValidatorConstraint({ name: 'passwordPolicy', async: false })
export class PasswordPolicyConstraint implements ValidatorConstraintInterface {
    validate(value: unknown): boolean {
        return typeof value === 'string' && isPasswordAcceptable(value);
    }

    defaultMessage(): string {
        return `password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters and must not be blank`;
    }
}
