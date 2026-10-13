import { createId } from '../Shared/createId.js';
import { ValidationError } from '../Shared/DomainError.js';

const PROVIDER_MAX = 32;
const SUBJECT_MAX = 255;

export class UserIdentity {
    private constructor(
        readonly id: string,
        readonly userId: string,
        readonly provider: string,
        readonly providerSubject: string,
        readonly createdAt: Date,
        readonly updatedAt: Date,
    ) {}

    static create(input: {
        userId: string;
        provider: string;
        providerSubject: string;
        now?: Date;
    }): UserIdentity {
        const provider = input.provider.trim();
        const providerSubject = input.providerSubject.trim();
        if (provider.length === 0 || provider.length > PROVIDER_MAX) {
            throw new ValidationError('Provider is invalid');
        }
        if (
            providerSubject.length === 0 ||
            providerSubject.length > SUBJECT_MAX
        ) {
            throw new ValidationError('Provider subject is invalid');
        }
        const now = input.now ?? new Date();
        return new UserIdentity(
            createId(),
            input.userId,
            provider,
            providerSubject,
            now,
            now,
        );
    }

    static rehydrate(input: {
        id: string;
        userId: string;
        provider: string;
        providerSubject: string;
        createdAt: Date;
        updatedAt: Date;
    }): UserIdentity {
        return new UserIdentity(
            input.id,
            input.userId,
            input.provider,
            input.providerSubject,
            input.createdAt,
            input.updatedAt,
        );
    }
}
