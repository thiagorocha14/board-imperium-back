import { ValidationPipe } from '@nestjs/common';
import type { ValidationError as ClassValidatorValidationError } from 'class-validator';
import { ValidationError } from '../Domain/Shared/DomainError.js';

export const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    validationError: { target: false, value: false },
    exceptionFactory: (errors: ClassValidatorValidationError[]) =>
        new ValidationError('Invalid request', flattenValidationErrors(errors)),
});

function flattenValidationErrors(
    errors: ClassValidatorValidationError[],
): string[] {
    return errors.flatMap((error) => {
        const messages = error.constraints
            ? Object.values(error.constraints)
            : [];
        const children = error.children?.length
            ? flattenValidationErrors(error.children)
            : [];
        return [...messages, ...children];
    });
}
