import type { UserIdentity } from './UserIdentity.js';

export const USER_IDENTITY_REPOSITORY = Symbol('USER_IDENTITY_REPOSITORY');

export interface IUserIdentityRepository {
    findByProviderSubject(
        provider: string,
        providerSubject: string,
    ): Promise<UserIdentity | null>;
    save(identity: UserIdentity): Promise<void>;
}
