import {
    type ValidationArguments,
    ValidatorConstraint,
    type ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'playerRange', async: false })
export class PlayerRangeConstraint implements ValidatorConstraintInterface {
    validate(_value: unknown, args: ValidationArguments): boolean {
        const candidate = args.object as {
            minPlayers?: unknown;
            maxPlayers?: unknown;
        };
        if (
            typeof candidate.minPlayers !== 'number' ||
            typeof candidate.maxPlayers !== 'number'
        ) {
            return true;
        }
        return candidate.maxPlayers >= candidate.minPlayers;
    }

    defaultMessage(_args: ValidationArguments): string {
        return 'maxPlayers must be greater than or equal to minPlayers';
    }
}
