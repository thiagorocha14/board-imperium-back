import { describe, expect, it } from 'vitest';
import type { AuthenticatedUser } from '../../../../../src/Auth/AuthenticatedUser.js';
import { BoardGame } from '../../../../../src/Domain/BoardGame/BoardGame.js';
import { GetBoardGame } from '../../../../../src/Domain/BoardGame/Get/GetBoardGame.js';
import type { IBoardGameRepository } from '../../../../../src/Domain/BoardGame/IBoardGameRepository.js';
import { NotFoundError } from '../../../../../src/Domain/Shared/DomainError.js';
import type { Page } from '../../../../../src/Domain/Shared/Page.js';
import { toBoardGameResponse } from '../../../../../src/API/BoardGame/BoardGameResponse.js';
import { GetBoardGameController } from '../../../../../src/API/BoardGame/Get/GetBoardGameController.js';

const owner: AuthenticatedUser = { id: 'owner' };
const intruder: AuthenticatedUser = { id: 'intruder' };
const strategyId = '6f1b7c2e-8a4d-4e1a-9c3b-2d5f6a7b8c9d';
const familyId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

describe('GET /board-games/:id', () => {
    it('returns the authenticated user game', async () => {
        const catan = game({
            userId: 'owner',
            name: 'Catan',
            level: 3,
            categoryIds: [strategyId],
            mechanicIds: [familyId],
        });
        const wingspan = game({
            userId: 'intruder',
            name: 'Wingspan',
            level: 5,
        });
        const repository = new RecordingBoardGames([wingspan, catan]);

        const body = await get(repository).execute(owner, catan.id);

        expect(repository.lookups).toEqual([{ id: catan.id, userId: 'owner' }]);
        expect(body).toEqual(toBoardGameResponse(catan));
        expect(body.id).not.toBe(wingspan.id);
        expect(Object.keys(body)).toEqual([
            'id',
            'name',
            'level',
            'complexity',
            'playTimeMinutes',
            'minPlayers',
            'maxPlayers',
            'purchasedAt',
            'imageUrl',
            'categoryIds',
            'mechanicIds',
            'createdAt',
            'updatedAt',
        ]);
    });

    it('returns not found when the game does not exist', async () => {
        const repository = new RecordingBoardGames([]);
        const missingId = 'c3d4e5f6-a7b8-4901-c234-56789abcdef0';

        await expect(
            get(repository).execute(owner, missingId),
        ).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof NotFoundError &&
                error.message === 'Board game not found',
        );
        expect(repository.lookups).toEqual([
            { id: missingId, userId: 'owner' },
        ]);
    });

    it('never returns a game that belongs to another user', async () => {
        const foreign = game({
            userId: 'intruder',
            name: 'Wingspan',
            level: 5,
            categoryIds: [strategyId],
            mechanicIds: [familyId],
        });
        const repository = new RecordingBoardGames([foreign]);

        await expect(
            get(repository).execute(owner, foreign.id),
        ).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof NotFoundError &&
                error.message === 'Board game not found',
        );
        expect(repository.lookups).toEqual([
            { id: foreign.id, userId: 'owner' },
        ]);

        const body = await get(repository).execute(intruder, foreign.id);
        expect(repository.lookups[1]).toEqual({
            id: foreign.id,
            userId: 'intruder',
        });
        expect(body).toEqual(toBoardGameResponse(foreign));
    });
});

function get(repository: IBoardGameRepository): GetBoardGameController {
    return new GetBoardGameController(new GetBoardGame(repository));
}

function game(input: {
    userId: string;
    name: string;
    level: number;
    categoryIds?: readonly string[];
    mechanicIds?: readonly string[];
}): BoardGame {
    return BoardGame.create({
        userId: input.userId,
        name: input.name,
        level: input.level,
        complexity: 2,
        playTimeMinutes: 60,
        minPlayers: 2,
        maxPlayers: 4,
        purchasedAt: '2026-05-10',
        imageUrl: 'https://exemplo.com/jogo.jpg',
        categoryIds: input.categoryIds ?? [],
        mechanicIds: input.mechanicIds ?? [],
        now: new Date('2026-05-11T00:00:00.000Z'),
    });
}

class RecordingBoardGames implements IBoardGameRepository {
    readonly lookups: { id: string; userId: string }[] = [];

    constructor(private readonly games: readonly BoardGame[]) {}

    async findByIdForUser(
        id: string,
        userId: string,
    ): Promise<BoardGame | null> {
        this.lookups.push({ id, userId });
        return (
            this.games.find(
                (item) => item.id === id && item.userId === userId,
            ) ?? null
        );
    }

    async findByNameForUser(): Promise<BoardGame | null> {
        return null;
    }

    async findPageForUser(): Promise<Page<BoardGame>> {
        return { items: [], page: 1, pageSize: 20, totalItems: 0 };
    }

    async findAllForUser(): Promise<BoardGame[]> {
        return [];
    }

    async drawForUser(): Promise<BoardGame | null> {
        return null;
    }

    async save(): Promise<void> {}

    async deleteForUser(): Promise<boolean> {
        return false;
    }
}
