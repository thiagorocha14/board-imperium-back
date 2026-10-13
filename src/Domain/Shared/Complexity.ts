import { ValidationError } from './DomainError.js';

export class Complexity {
    private constructor(readonly value: number) {}

    static create(value: number): Complexity {
        if (!Number.isFinite(value)) {
            throw new ValidationError('Complexity must be between 1 and 5');
        }
        const normalized = Number(value.toFixed(2));
        if (Math.abs(normalized - value) > 1e-8) {
            throw new ValidationError(
                'Complexity must have at most 2 decimal places',
            );
        }
        if (normalized < 1 || normalized > 5) {
            throw new ValidationError('Complexity must be between 1 and 5');
        }
        return new Complexity(normalized);
    }
}
