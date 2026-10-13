import { describe, expect, it } from 'vitest';
import type { AuthenticatedUser } from '../../../../../src/Auth/AuthenticatedUser.js';
import { BoardGame } from '../../../../../src/Domain/BoardGame/BoardGame.js';
import { ListBoardGameCollection } from '../../../../../src/Domain/BoardGame/Collection/ListBoardGameCollection.js';
import type { IBoardGameRepository } from '../../../../../src/Domain/BoardGame/IBoardGameRepository.js';
import type { Page } from '../../../../../src/Domain/Shared/Page.js';
import { ListBoardGameCollectionController } from '../../../../../src/API/BoardGame/Collection/ListBoardGameCollectionController.js';

const owner: AuthenticatedUser = { id: 'owner' };

describe('GET /board-games/collection', () => {
    it('returns only the authenticated user games, newest first', async () => {
        const asked: string[] = [];
        const azul = game({
            userId: 'owner',
            name: 'Azul',
            level: 1,
            purchasedAt: null,
            imageUrl: null,
            now: new Date('2024-03-01T00:00:00.000Z'),
        });
        const catan = game({
            userId: 'owner',
            name: 'Catan',
            level: 3,
            purchasedAt: '2026-05-10',
            imageUrl: 'https://exemplo.com/catan.jpg',
            now: new Date('2026-05-11T00:00:00.000Z'),
        });
        const wingspan = game({
            userId: 'other',
            name: 'Wingspan',
            level: 5,
            purchasedAt: '2026-08-01',
            imageUrl: 'https://exemplo.com/wingspan.jpg',
            now: new Date('2026-08-02T00:00:00.000Z'),
        });
        const repository = new InMemoryBoardGames(
            [azul, catan, wingspan],
            asked,
        );
        const body = await collection(repository).execute(owner);

        expect(asked).toEqual(['owner']);
        expect(body).toEqual([
            {
                id: catan.id,
                name: 'Catan',
                level: 3,
                purchasedAt: '2026-05-10',
                imageUrl: 'https://exemplo.com/catan.jpg',
            },
            {
                id: azul.id,
                name: 'Azul',
                level: 1,
                purchasedAt: null,
                imageUrl: null,
            },
        ]);
        for (const item of body) {
            expect(Object.keys(item)).toEqual([
                'id',
                'name',
                'level',
                'purchasedAt',
                'imageUrl',
            ]);
        }
    });

    it('returns an empty array when the user has no games', async () => {
        const repository = new InMemoryBoardGames(
            [
                game({
                    userId: 'other',
                    name: 'Wingspan',
                    level: 2,
                    now: new Date('2026-08-02T00:00:00.000Z'),
                }),
            ],
            [],
        );

        await expect(collection(repository).execute(owner)).resolves.toEqual(
            [],
        );
    });
});

function collection(
    repository: IBoardGameRepository,
): ListBoardGameCollectionController {
    return new ListBoardGameCollectionController(
        new ListBoardGameCollection(repository),
    );
}

function game(input: {
    userId: string;
    name: string;
    level: number;
    purchasedAt?: string | null;
    imageUrl?: string | null;
    now: Date;
}): BoardGame {
    return BoardGame.create({
        userId: input.userId,
        name: input.name,
        level: input.level,
        complexity: 2,
        playTimeMinutes: 60,
        minPlayers: 2,
        maxPlayers: 4,
        purchasedAt: input.purchasedAt ?? null,
        imageUrl: input.imageUrl ?? null,
        categoryIds: [],
        mechanicIds: [],
        now: input.now,
    });
}

class InMemoryBoardGames implements IBoardGameRepository {
    constructor(
        private readonly games: readonly BoardGame[],
        private readonly asked: string[],
    ) {}

    async drawForUser(): Promise<BoardGame | null> {
        return null;
    }

    async findAllForUser(userId: string): Promise<BoardGame[]> {
        this.asked.push(userId);
        return this.games
            .filter((game) => game.userId === userId)
            .sort(
                (left, right) =>
                    right.createdAt.getTime() - left.createdAt.getTime(),
            );
    }

    async findByIdForUser(): Promise<BoardGame | null> {
        return null;
    }

    async findByNameForUser(): Promise<BoardGame | null> {
        return null;
    }

    async findPageForUser(): Promise<Page<BoardGame>> {
        return { items: [], page: 1, pageSize: 20, totalItems: 0 };
    }

    async save(): Promise<void> {}

    async deleteForUser(): Promise<boolean> {
        return false;
    }
}
