import { ValidationError } from '../Shared/DomainError.js';

export const LEVEL_MIN = 1;
export const LEVEL_MAX = 5;

export class Level {
    private constructor(readonly value: number) {}

    static create(value: unknown): Level {
        if (value == null) {
            throw new ValidationError('Level is required');
        }
        if (
            typeof value !== 'number' ||
            !Number.isInteger(value) ||
            value < LEVEL_MIN ||
            value > LEVEL_MAX
        ) {
            throw new ValidationError(
                `Level must be an integer between ${LEVEL_MIN} and ${LEVEL_MAX}`,
            );
        }
        return new Level(value);
    }
}
