import { User } from '../../../Domain/User/User.js';
import { UserEntity } from '../../../Persistence/User/UserEntity.js';

export function toUserEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.displayName = user.displayName;
    entity.avatarUrl = user.avatarUrl;
    entity.lastLoginAt = user.lastLoginAt;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    return entity;
}

export function toUser(entity: UserEntity): User {
    return User.rehydrate({
        id: entity.id,
        email: entity.email,
        displayName: entity.displayName,
        avatarUrl: entity.avatarUrl,
        lastLoginAt: entity.lastLoginAt,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    });
}
