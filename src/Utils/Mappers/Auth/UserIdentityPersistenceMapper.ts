import { UserIdentity } from '../../../Domain/Auth/UserIdentity.js';
import { UserIdentityEntity } from '../../../Persistence/Auth/UserIdentityEntity.js';

export function toUserIdentityEntity(
    identity: UserIdentity,
): UserIdentityEntity {
    const entity = new UserIdentityEntity();
    entity.id = identity.id;
    entity.userId = identity.userId;
    entity.provider = identity.provider;
    entity.providerSubject = identity.providerSubject;
    entity.createdAt = identity.createdAt;
    entity.updatedAt = identity.updatedAt;
    return entity;
}

export function toUserIdentity(entity: UserIdentityEntity): UserIdentity {
    return UserIdentity.rehydrate(entity);
}
