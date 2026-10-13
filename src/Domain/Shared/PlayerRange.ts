import { ValidationError } from './DomainError.js';

export class PlayerRange {
    private constructor(
        readonly min: number,
        readonly max: number,
    ) {}

    static create(min: number, max: number): PlayerRange {
        if (!Number.isInteger(min) || min < 1) {
            throw new ValidationError(
                'Minimum players must be an integer of at least 1',
            );
        }
        if (!Number.isInteger(max) || max < min) {
            throw new ValidationError(
                'Maximum players must be an integer greater than or equal to minimum players',
            );
        }
        return new PlayerRange(min, max);
    }
}
