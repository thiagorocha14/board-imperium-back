import type { UserCredential } from './UserCredential.js';

export const USER_CREDENTIAL_REPOSITORY = Symbol('USER_CREDENTIAL_REPOSITORY');

export interface IUserCredentialRepository {
    findByUserId(userId: string): Promise<UserCredential | null>;
    save(credential: UserCredential): Promise<void>;
}
