import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '../../../../../src/Auth/AuthenticatedUser.js';
import { BoardGame } from '../../../../../src/Domain/BoardGame/BoardGame.js';
import type { IBoardGameRepository } from '../../../../../src/Domain/BoardGame/IBoardGameRepository.js';
import { UpdateBoardGame } from '../../../../../src/Domain/BoardGame/Update/UpdateBoardGame.js';
import { Category } from '../../../../../src/Domain/Category/Category.js';
import type { ICategoryRepository } from '../../../../../src/Domain/Category/ICategoryRepository.js';
import { Mechanic } from '../../../../../src/Domain/Mechanic/Mechanic.js';
import type { IMechanicRepository } from '../../../../../src/Domain/Mechanic/IMechanicRepository.js';
import {
    ConflictError,
    NotFoundError,
} from '../../../../../src/Domain/Shared/DomainError.js';
import type { IUnitOfWork } from '../../../../../src/Domain/Shared/IUnitOfWork.js';
import type { Page } from '../../../../../src/Domain/Shared/Page.js';
import { toBoardGameResponse } from '../../../../../src/API/BoardGame/BoardGameResponse.js';
import { UpdateBoardGameController } from '../../../../../src/API/BoardGame/Update/UpdateBoardGameController.js';

const owner: AuthenticatedUser = { id: 'owner' };
const intruder: AuthenticatedUser = { id: 'intruder' };
const createdAt = new Date('2026-05-11T00:00:00.000Z');
const updatedAt = new Date('2026-10-11T12:00:00.000Z');
const strategyId = '6f1b7c2e-8a4d-4e1a-9c3b-2d5f6a7b8c9d';
const familyId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
const draftingId = 'd4e5f6a7-b8c9-4012-d345-6789abcdef01';

describe('PATCH /board-games/:id', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(updatedAt);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('updates only the sent fields and returns the board game', async () => {
        const catan = game({
            userId: 'owner',
            name: 'Catan',
            level: 3,
            categoryIds: [strategyId],
            mechanicIds: [familyId],
        });
        const repository = new RecordingBoardGames([catan]);

        const body = await update(repository).execute(owner, catan.id, {
            name: '  Catan: Navegadores  ',
            level: 4,
            complexity: 3.5,
            playTimeMinutes: 90,
            minPlayers: 3,
            maxPlayers: 5,
            purchasedAt: '2026-01-15',
            imageUrl: 'https://exemplo.com/navegadores.jpg',
        });

        expect(repository.saved).toEqual([catan]);
        expect(body).toEqual(toBoardGameResponse(catan));
        expect(body).toMatchObject({
            id: catan.id,
            name: 'Catan: Navegadores',
            level: 4,
            complexity: 3.5,
            playTimeMinutes: 90,
            minPlayers: 3,
            maxPlayers: 5,
            purchasedAt: '2026-01-15',
            imageUrl: 'https://exemplo.com/navegadores.jpg',
            categoryIds: [strategyId],
            mechanicIds: [familyId],
            createdAt: createdAt.toISOString(),
            updatedAt: updatedAt.toISOString(),
        });
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

    it('clears purchase date and image when they are null', async () => {
        const catan = game({ userId: 'owner', name: 'Catan', level: 3 });
        const repository = new RecordingBoardGames([catan]);

        const body = await update(repository).execute(owner, catan.id, {
            purchasedAt: null,
            imageUrl: null,
        });

        expect(body.purchasedAt).toBeNull();
        expect(body.imageUrl).toBeNull();
        expect(body.name).toBe('Catan');
        expect(body.level).toBe(3);
        expect(body.updatedAt).toBe(updatedAt.toISOString());
    });

    it('replaces categories and mechanics that belong to the user', async () => {
        const catan = game({
            userId: 'owner',
            name: 'Catan',
            level: 2,
            categoryIds: [strategyId],
            mechanicIds: [familyId],
        });
        const party = Category.create({
            userId: 'owner',
            name: 'Festa',
            now: createdAt,
        });
        const drafting = mechanic(draftingId, 'Draft');
        const repository = new RecordingBoardGames([catan]);

        const body = await update(
            repository,
            [party],
            [drafting, mechanic(familyId, 'Família')],
        ).execute(owner, catan.id, {
            categoryIds: [party.id],
            mechanicIds: [draftingId],
        });

        expect(body.categoryIds).toEqual([party.id]);
        expect(body.mechanicIds).toEqual([draftingId]);
        expect(body.name).toBe('Catan');
        expect(repository.saved).toEqual([catan]);
    });

    it('returns not found when the game does not exist or belongs to another user', async () => {
        const foreign = game({
            userId: 'intruder',
            name: 'Wingspan',
            level: 5,
        });
        const repository = new RecordingBoardGames([foreign]);
        const missingId = 'c3d4e5f6-a7b8-4901-c234-56789abcdef0';

        await expect(
            update(repository).execute(owner, missingId, { level: 1 }),
        ).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof NotFoundError &&
                error.message === 'Board game not found',
        );
        await expect(
            update(repository).execute(owner, foreign.id, { name: 'Roubado' }),
        ).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof NotFoundError &&
                error.message === 'Board game not found',
        );

        expect(foreign.name).toBe('Wingspan');
        expect(repository.saved).toEqual([]);
        expect(repository.lookups).toEqual([
            { id: missingId, userId: 'owner' },
            { id: foreign.id, userId: 'owner' },
        ]);

        const body = await update(repository).execute(intruder, foreign.id, {
            level: 4,
        });
        expect(body).toEqual(toBoardGameResponse(foreign));
        expect(body.level).toBe(4);
    });

    it('rejects a name that already exists for the user', async () => {
        const catan = game({ userId: 'owner', name: 'Catan', level: 3 });
        const azul = game({ userId: 'owner', name: 'Azul', level: 1 });
        const repository = new RecordingBoardGames([catan, azul]);

        await expect(
            update(repository).execute(owner, catan.id, { name: ' Azul ' }),
        ).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof ConflictError &&
                error.message === 'Board game name already exists',
        );
        expect(catan.name).toBe('Catan');
        expect(repository.saved).toEqual([]);
    });

    it('returns not found when a category or mechanic is unknown', async () => {
        const catan = game({ userId: 'owner', name: 'Catan', level: 3 });
        const foreignCategory = Category.create({
            userId: 'intruder',
            name: 'Festa',
            now: createdAt,
        });
        const repository = new RecordingBoardGames([catan]);

        await expect(
            update(repository, [foreignCategory], []).execute(owner, catan.id, {
                categoryIds: [foreignCategory.id],
            }),
        ).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof NotFoundError &&
                error.message === 'Category not found',
        );
        await expect(
            update(repository, [], []).execute(owner, catan.id, {
                mechanicIds: [draftingId],
            }),
        ).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof NotFoundError &&
                error.message === 'Mechanic not found',
        );
        expect(catan.categoryIds).toEqual([]);
        expect(catan.mechanicIds).toEqual([]);
        expect(repository.saved).toEqual([]);
    });
});

function update(
    boardGames: IBoardGameRepository,
    categories: readonly Category[] = [],
    mechanics: readonly Mechanic[] = [],
): UpdateBoardGameController {
    return new UpdateBoardGameController(
        new UpdateBoardGame(
            boardGames,
            new OwnedCategories(categories),
            new KnownMechanics(mechanics),
            new ImmediateUnitOfWork(),
        ),
    );
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
        now: createdAt,
    });
}

function mechanic(id: string, name: string): Mechanic {
    return Mechanic.rehydrate({
        id,
        name,
        description: null,
        createdAt,
        updatedAt: createdAt,
    });
}

class RecordingBoardGames implements IBoardGameRepository {
    readonly lookups: { id: string; userId: string }[] = [];
    readonly saved: BoardGame[] = [];

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

    async findByNameForUser(
        userId: string,
        name: string,
    ): Promise<BoardGame | null> {
        return (
            this.games.find(
                (item) => item.userId === userId && item.name === name,
            ) ?? null
        );
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

    async save(game: BoardGame): Promise<void> {
        this.saved.push(game);
    }

    async deleteForUser(): Promise<boolean> {
        return false;
    }
}

class OwnedCategories implements ICategoryRepository {
    constructor(private readonly categories: readonly Category[]) {}

    async findByIdForUser(): Promise<Category | null> {
        return null;
    }

    async findByIdsForUser(
        ids: readonly string[],
        userId: string,
    ): Promise<Category[]> {
        return this.categories.filter(
            (category) =>
                ids.includes(category.id) && category.userId === userId,
        );
    }

    async findByNameForUser(): Promise<Category | null> {
        return null;
    }

    async listForUser(): Promise<Category[]> {
        return [];
    }

    async save(): Promise<void> {}

    async deleteForUser(): Promise<boolean> {
        return false;
    }
}

class KnownMechanics implements IMechanicRepository {
    constructor(private readonly mechanics: readonly Mechanic[]) {}

    async findByIds(ids: readonly string[]): Promise<Mechanic[]> {
        return this.mechanics.filter((mechanic) => ids.includes(mechanic.id));
    }

    async list(): Promise<Mechanic[]> {
        return [...this.mechanics];
    }
}

class ImmediateUnitOfWork implements IUnitOfWork {
    async run<T>(work: () => Promise<T>): Promise<T> {
        return work();
    }
}
