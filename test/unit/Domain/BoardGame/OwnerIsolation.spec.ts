import { describe, expect, it } from 'vitest';
import { NotFoundError } from '../../../../src/Domain/Shared/DomainError.js';
import type { IUnitOfWork } from '../../../../src/Domain/Shared/IUnitOfWork.js';
import type { Category } from '../../../../src/Domain/Category/Category.js';
import type { ICategoryRepository } from '../../../../src/Domain/Category/ICategoryRepository.js';
import type { IMechanicRepository } from '../../../../src/Domain/Mechanic/IMechanicRepository.js';
import type { Mechanic } from '../../../../src/Domain/Mechanic/Mechanic.js';
import { BoardGame } from '../../../../src/Domain/BoardGame/BoardGame.js';
import { GetBoardGame } from '../../../../src/Domain/BoardGame/Get/GetBoardGame.js';
import type { IBoardGameRepository } from '../../../../src/Domain/BoardGame/IBoardGameRepository.js';
import { UpdateBoardGame } from '../../../../src/Domain/BoardGame/Update/UpdateBoardGame.js';
import type { Page } from '../../../../src/Domain/Shared/Page.js';

describe('board game owner isolation', () => {
    it('returns not found when the game belongs to another user', async () => {
        const game = BoardGame.create({
            userId: 'owner',
            name: 'Azul',
            level: 1,
            complexity: 1.8,
            playTimeMinutes: 45,
            minPlayers: 2,
            maxPlayers: 4,
            categoryIds: [],
            mechanicIds: [],
        });
        const seen: string[] = [];
        const repository: IBoardGameRepository = {
            async findByIdForUser(id, userId) {
                seen.push(userId);
                return id === game.id && userId === game.userId ? game : null;
            },
            async findByNameForUser() {
                return null;
            },
            async findPageForUser() {
                return emptyPage();
            },
            async findAllForUser() {
                return [];
            },
            async drawForUser() {
                return null;
            },
            async save() {},
            async deleteForUser() {
                return false;
            },
        };

        await expect(
            new GetBoardGame(repository).execute('intruder', game.id),
        ).rejects.toBeInstanceOf(NotFoundError);
        expect(seen).toEqual(['intruder']);
    });

    it('returns not found when a category belongs to another user', async () => {
        const game = BoardGame.create({
            userId: 'owner',
            name: 'Azul',
            level: 1,
            complexity: 1.8,
            playTimeMinutes: 45,
            minPlayers: 2,
            maxPlayers: 4,
            categoryIds: [],
            mechanicIds: [],
        });
        const boardGames = new SingleGameRepository(game);
        const update = new UpdateBoardGame(
            boardGames,
            new ForeignCategoryRepository(),
            new EmptyMechanicRepository(),
            new ImmediateUnitOfWork(),
        );

        await expect(
            update.execute({
                userId: 'owner',
                boardGameId: game.id,
                categoryIds: ['category-of-someone-else'],
            }),
        ).rejects.toBeInstanceOf(NotFoundError);
    });
});

class ImmediateUnitOfWork implements IUnitOfWork {
    async run<T>(work: () => Promise<T>): Promise<T> {
        return work();
    }
}

class SingleGameRepository implements IBoardGameRepository {
    constructor(private readonly game: BoardGame) {}

    async findByIdForUser(
        id: string,
        userId: string,
    ): Promise<BoardGame | null> {
        return id === this.game.id && userId === this.game.userId
            ? this.game
            : null;
    }

    async findByNameForUser(): Promise<BoardGame | null> {
        return null;
    }

    async findPageForUser(): Promise<Page<BoardGame>> {
        return emptyPage();
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

class ForeignCategoryRepository implements ICategoryRepository {
    async findByIdForUser(): Promise<Category | null> {
        return null;
    }

    async findByIdsForUser(): Promise<Category[]> {
        return [];
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

class EmptyMechanicRepository implements IMechanicRepository {
    async findByIds(): Promise<Mechanic[]> {
        return [];
    }

    async list(): Promise<Mechanic[]> {
        return [];
    }
}

function emptyPage(): Page<BoardGame> {
    return { items: [], page: 1, pageSize: 20, totalItems: 0 };
}
