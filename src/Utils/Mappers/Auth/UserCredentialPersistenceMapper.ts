import { UserCredential } from '../../../Domain/Auth/UserCredential.js';
import { UserCredentialEntity } from '../../../Persistence/Auth/UserCredentialEntity.js';

export function toUserCredentialEntity(
    credential: UserCredential,
): UserCredentialEntity {
    const entity = new UserCredentialEntity();
    entity.userId = credential.userId;
    entity.passwordHash = credential.passwordHash;
    entity.createdAt = credential.createdAt;
    entity.updatedAt = credential.updatedAt;
    return entity;
}

export function toUserCredential(entity: UserCredentialEntity): UserCredential {
    return UserCredential.rehydrate(entity);
}
