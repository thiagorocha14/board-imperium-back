import { BoardGame } from '../../../Domain/BoardGame/BoardGame.js';
import { BoardGameEntity } from '../../../Persistence/BoardGame/BoardGameEntity.js';

export function toBoardGameEntity(game: BoardGame): BoardGameEntity {
    const entity = new BoardGameEntity();
    entity.id = game.id;
    entity.userId = game.userId;
    entity.name = game.name;
    entity.level = game.level;
    entity.complexity = game.complexity;
    entity.playTimeMinutes = game.playTimeMinutes;
    entity.minPlayers = game.minPlayers;
    entity.maxPlayers = game.maxPlayers;
    entity.purchasedAt = game.purchasedAt;
    entity.imageUrl = game.imageUrl;
    entity.createdAt = game.createdAt;
    entity.updatedAt = game.updatedAt;
    return entity;
}

export function toBoardGame(
    entity: BoardGameEntity,
    categoryIds: readonly string[],
    mechanicIds: readonly string[],
): BoardGame {
    return BoardGame.rehydrate({
        id: entity.id,
        userId: entity.userId,
        name: entity.name,
        level: entity.level,
        complexity: entity.complexity,
        playTimeMinutes: entity.playTimeMinutes,
        minPlayers: entity.minPlayers,
        maxPlayers: entity.maxPlayers,
        purchasedAt: entity.purchasedAt,
        imageUrl: entity.imageUrl,
        categoryIds,
        mechanicIds,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    });
}
