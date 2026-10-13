import type { BoardGame } from '../../Domain/BoardGame/BoardGame.js';

export function toBoardGameResponse(game: BoardGame) {
    return {
        id: game.id,
        name: game.name,
        level: game.level,
        complexity: game.complexity,
        playTimeMinutes: game.playTimeMinutes,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        purchasedAt: game.purchasedAt,
        imageUrl: game.imageUrl,
        categoryIds: game.categoryIds,
        mechanicIds: game.mechanicIds,
        createdAt: game.createdAt.toISOString(),
        updatedAt: game.updatedAt.toISOString(),
    };
}
