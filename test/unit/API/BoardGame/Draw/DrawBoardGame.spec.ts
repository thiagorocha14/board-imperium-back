import { describe, expect, it } from 'vitest';
import type { AuthenticatedUser } from '../../../../../src/Auth/AuthenticatedUser.js';
import { BoardGame } from '../../../../../src/Domain/BoardGame/BoardGame.js';
import type { BoardGameDrawFilters } from '../../../../../src/Domain/BoardGame/Draw/BoardGameDrawFilters.js';
import { DrawBoardGame } from '../../../../../src/Domain/BoardGame/Draw/DrawBoardGame.js';
import type { IBoardGameRepository } from '../../../../../src/Domain/BoardGame/IBoardGameRepository.js';
import { NotFoundError } from '../../../../../src/Domain/Shared/DomainError.js';
import type { Page } from '../../../../../src/Domain/Shared/Page.js';
import { toBoardGameResponse } from '../../../../../src/API/BoardGame/BoardGameResponse.js';
import { DrawBoardGameController } from '../../../../../src/API/BoardGame/Draw/DrawBoardGameController.js';

const owner: AuthenticatedUser = { id: 'owner' };
const intruder: AuthenticatedUser = { id: 'intruder' };
const strategyId = '6f1b7c2e-8a4d-4e1a-9c3b-2d5f6a7b8c9d';
const familyId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
const partyId = 'b2c3d4e5-f6a7-4890-b123-456789abcdef';

describe('GET /board-games/draw', () => {
    it('draws one game from the authenticated user when no filter is sent', async () => {
        const catan = game({
            userId: 'owner',
            name: 'Catan',
            level: 3,
            categoryIds: [strategyId],
            mechanicIds: [familyId],
        });
        const azul = game({
            userId: 'owner',
            name: 'Azul',
            level: 1,
            categoryIds: [partyId],
            mechanicIds: [],
        });
        const wingspan = game({
            userId: 'intruder',
            name: 'Wingspan',
            level: 3,
            categoryIds: [strategyId],
            mechanicIds: [familyId],
        });
        const repository = new RecordingBoardGames([wingspan, azul, catan]);

        const body = await draw(repository).execute(owner, {});

        expect(repository.draws).toEqual([{ userId: 'owner', filters: {} }]);
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

    it('forwards a level filter and returns the matching game', async () => {
        const casual = game({ userId: 'owner', name: 'Azul', level: 1 });
        const medium = game({ userId: 'owner', name: 'Catan', level: 3 });
        const repository = new RecordingBoardGames([casual, medium]);

        const body = await draw(repository).execute(owner, { level: 3 });

        expect(repository.draws).toEqual([
            { userId: 'owner', filters: { level: 3 } },
        ]);
        expect(body).toEqual(toBoardGameResponse(medium));
    });

    it('forwards a category filter and returns the matching game', async () => {
        const strategy = game({
            userId: 'owner',
            name: 'Catan',
            level: 3,
            categoryIds: [strategyId],
        });
        const party = game({
            userId: 'owner',
            name: 'Azul',
            level: 3,
            categoryIds: [partyId],
        });
        const repository = new RecordingBoardGames([party, strategy]);

        const body = await draw(repository).execute(owner, {
            categoryId: strategyId,
        });

        expect(repository.draws).toEqual([
            { userId: 'owner', filters: { categoryId: strategyId } },
        ]);
        expect(body).toEqual(toBoardGameResponse(strategy));
    });

    it('forwards a mechanic filter and returns the matching game', async () => {
        const family = game({
            userId: 'owner',
            name: 'Catan',
            level: 2,
            mechanicIds: [familyId],
        });
        const other = game({
            userId: 'owner',
            name: 'Azul',
            level: 2,
            mechanicIds: [partyId],
        });
        const repository = new RecordingBoardGames([other, family]);

        const body = await draw(repository).execute(owner, {
            mechanicId: familyId,
        });

        expect(repository.draws).toEqual([
            { userId: 'owner', filters: { mechanicId: familyId } },
        ]);
        expect(body).toEqual(toBoardGameResponse(family));
    });

    it('combines level, category and mechanic with AND', async () => {
        const match = game({
            userId: 'owner',
            name: 'Catan',
            level: 2,
            categoryIds: [strategyId],
            mechanicIds: [familyId],
        });
        const wrongLevel = game({
            userId: 'owner',
            name: 'Azul',
            level: 4,
            categoryIds: [strategyId],
            mechanicIds: [familyId],
        });
        const wrongCategory = game({
            userId: 'owner',
            name: 'Wingspan',
            level: 2,
            categoryIds: [partyId],
            mechanicIds: [familyId],
        });
        const wrongMechanic = game({
            userId: 'owner',
            name: 'Pandemic',
            level: 2,
            categoryIds: [strategyId],
            mechanicIds: [partyId],
        });
        const repository = new RecordingBoardGames([
            wrongLevel,
            wrongCategory,
            wrongMechanic,
            match,
        ]);

        const body = await draw(repository).execute(owner, {
            level: 2,
            categoryId: strategyId,
            mechanicId: familyId,
        });

        expect(repository.draws).toEqual([
            {
                userId: 'owner',
                filters: {
                    level: 2,
                    categoryId: strategyId,
                    mechanicId: familyId,
                },
            },
        ]);
        expect(body).toEqual(toBoardGameResponse(match));
    });

    it('returns not found when no game matches the filters', async () => {
        const repository = new RecordingBoardGames([
            game({ userId: 'owner', name: 'Azul', level: 1 }),
        ]);

        await expect(
            draw(repository).execute(owner, { level: 5 }),
        ).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof NotFoundError &&
                error.message ===
                    'No board game found for the selected filters',
        );
    });

    it('never draws a game that belongs to another user', async () => {
        const foreign = game({
            userId: 'intruder',
            name: 'Wingspan',
            level: 5,
            categoryIds: [strategyId],
            mechanicIds: [familyId],
        });
        const repository = new RecordingBoardGames([foreign]);

        await expect(
            draw(repository).execute(owner, {}),
        ).rejects.toBeInstanceOf(NotFoundError);
        expect(repository.draws).toEqual([{ userId: 'owner', filters: {} }]);

        const body = await draw(repository).execute(intruder, {});
        expect(repository.draws[1]).toEqual({
            userId: 'intruder',
            filters: {},
        });
        expect(body).toEqual(toBoardGameResponse(foreign));
    });
});

function draw(repository: IBoardGameRepository): DrawBoardGameController {
    return new DrawBoardGameController(new DrawBoardGame(repository));
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
    readonly draws: { userId: string; filters: BoardGameDrawFilters }[] = [];

    constructor(private readonly games: readonly BoardGame[]) {}

    async drawForUser(
        userId: string,
        filters: BoardGameDrawFilters,
    ): Promise<BoardGame | null> {
        this.draws.push({ userId, filters });
        const matches = this.games.filter((item) =>
            matchesFilters(item, userId, filters),
        );
        return matches.at(-1) ?? null;
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

    async findAllForUser(): Promise<BoardGame[]> {
        return [];
    }

    async save(): Promise<void> {}

    async deleteForUser(): Promise<boolean> {
        return false;
    }
}

function matchesFilters(
    item: BoardGame,
    userId: string,
    filters: BoardGameDrawFilters,
): boolean {
    if (item.userId !== userId) {
        return false;
    }
    if (filters.level !== undefined && item.level !== filters.level) {
        return false;
    }
    if (
        filters.categoryId !== undefined &&
        !item.categoryIds.includes(filters.categoryId)
    ) {
        return false;
    }
    if (
        filters.mechanicId !== undefined &&
        !item.mechanicIds.includes(filters.mechanicId)
    ) {
        return false;
    }
    return true;
}
