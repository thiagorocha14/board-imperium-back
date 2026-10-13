import { RefreshToken } from '../../../Domain/Auth/RefreshToken.js';
import { RefreshTokenEntity } from '../../../Persistence/Auth/RefreshTokenEntity.js';

export function toRefreshTokenEntity(token: RefreshToken): RefreshTokenEntity {
    const entity = new RefreshTokenEntity();
    entity.id = token.id;
    entity.userId = token.userId;
    entity.familyId = token.familyId;
    entity.tokenHash = token.tokenHash;
    entity.expiresAt = token.expiresAt;
    entity.revokedAt = token.revokedAt;
    entity.replacedById = token.replacedById;
    entity.userAgent = token.userAgent;
    entity.createdAt = token.createdAt;
    entity.updatedAt = token.updatedAt;
    return entity;
}

export function toRefreshToken(entity: RefreshTokenEntity): RefreshToken {
    return RefreshToken.rehydrate(entity);
}
