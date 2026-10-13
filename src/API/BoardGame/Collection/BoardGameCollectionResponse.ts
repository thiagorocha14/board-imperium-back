import type { BoardGame } from '../../../Domain/BoardGame/BoardGame.js';

export interface BoardGameCollectionItem {
    id: string;
    name: string;
    level: number;
    purchasedAt: string | null;
    imageUrl: string | null;
}

export function toBoardGameCollectionItem(
    game: BoardGame,
): BoardGameCollectionItem {
    return {
        id: game.id,
        name: game.name,
        level: game.level,
        purchasedAt: game.purchasedAt,
        imageUrl: game.imageUrl,
    };
}
