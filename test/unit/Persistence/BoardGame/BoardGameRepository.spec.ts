import { describe, expect, it } from 'vitest';
import { In, type DataSource } from 'typeorm';
import type { BoardGameDrawFilters } from '../../../../src/Domain/BoardGame/Draw/BoardGameDrawFilters.js';
import { BoardGameCategoryEntity } from '../../../../src/Persistence/BoardGame/BoardGameCategoryEntity.js';
import { BoardGameEntity } from '../../../../src/Persistence/BoardGame/BoardGameEntity.js';
import { BoardGameMechanicEntity } from '../../../../src/Persistence/BoardGame/BoardGameMechanicEntity.js';
import { BoardGameRepository } from '../../../../src/Persistence/BoardGame/BoardGameRepository.js';

describe('BoardGameRepository.findAllForUser', () => {
    it('queries only that user and orders by newest registration first', async () => {
        const queries: unknown[] = [];
        const dataSource = {
            manager: {
                getRepository: () => ({
                    find: async (options: unknown) => {
                        queries.push(options);
                        return [];
                    },
                }),
            },
        } as unknown as DataSource;

        const games = await new BoardGameRepository(dataSource).findAllForUser(
            'user-1',
        );

        expect(games).toEqual([]);
        expect(queries).toEqual([
            {
                where: { userId: 'user-1' },
                order: { createdAt: 'DESC' },
            },
        ]);
    });
});

describe('BoardGameRepository.drawForUser', () => {
    const categoryId = '6f1b7c2e-8a4d-4e1a-9c3b-2d5f6a7b8c9d';
    const mechanicId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

    it('picks one random game of that user in the database when no filter is sent', async () => {
        const query = new RecordingQuery();

        const game = await new BoardGameRepository(
            query.dataSource(),
        ).drawForUser('user-1', {});

        expect(game).toBeNull();
        expect(query.alias).toBe('game');
        expect(query.candidateSteps).toEqual([
            ['select', 'game.id', 'id'],
            ['distinct', true],
            ['where', 'game.user_id = :userId', { userId: 'user-1' }],
            ['getParameters'],
            ['getQuery'],
        ]);
        expect(query.drawSteps).toEqual([
            ['select', 'picked.id', 'id'],
            ['from', '(CANDIDATES)', 'picked'],
            ['orderBy', 'RAND()'],
            ['limit', 1],
            ['setParameters', { userId: 'user-1' }],
            ['getRawOne'],
        ]);
    });

    it('filters by level in the database', async () => {
        const query = new RecordingQuery();

        await new BoardGameRepository(query.dataSource()).drawForUser(
            'user-1',
            {
                level: 3,
            },
        );

        expect(query.candidateSteps).toContainEqual([
            'andWhere',
            'game.level = :level',
            { level: 3 },
        ]);
        expect(
            query.candidateSteps.some((step) => step[0] === 'innerJoin'),
        ).toBe(false);
        expect(query.drawSteps).toContainEqual(['orderBy', 'RAND()']);
        expect(query.drawSteps).toContainEqual(['limit', 1]);
    });

    it('filters by category in the database without duplicating the game', async () => {
        const query = new RecordingQuery();

        await new BoardGameRepository(query.dataSource()).drawForUser(
            'user-1',
            {
                categoryId,
            },
        );

        expect(query.candidateSteps).toContainEqual([
            'innerJoin',
            BoardGameCategoryEntity,
            'category',
            'category.board_game_id = game.id AND category.category_id = :categoryId',
            { categoryId },
        ]);
        expect(query.candidateSteps).toContainEqual(['distinct', true]);
    });

    it('filters by mechanic in the database without duplicating the game', async () => {
        const query = new RecordingQuery();

        await new BoardGameRepository(query.dataSource()).drawForUser(
            'user-1',
            {
                mechanicId,
            },
        );

        expect(query.candidateSteps).toContainEqual([
            'innerJoin',
            BoardGameMechanicEntity,
            'mechanic',
            'mechanic.board_game_id = game.id AND mechanic.mechanic_id = :mechanicId',
            { mechanicId },
        ]);
        expect(query.candidateSteps).toContainEqual(['distinct', true]);
    });

    it('applies user, level, category and mechanic together before choosing one row', async () => {
        const query = new RecordingQuery();
        const filters: BoardGameDrawFilters = {
            level: 2,
            categoryId,
            mechanicId,
        };

        await new BoardGameRepository(query.dataSource()).drawForUser(
            'user-1',
            filters,
        );

        expect(query.candidateSteps).toEqual([
            ['select', 'game.id', 'id'],
            ['distinct', true],
            ['where', 'game.user_id = :userId', { userId: 'user-1' }],
            ['andWhere', 'game.level = :level', { level: 2 }],
            [
                'innerJoin',
                BoardGameCategoryEntity,
                'category',
                'category.board_game_id = game.id AND category.category_id = :categoryId',
                { categoryId },
            ],
            [
                'innerJoin',
                BoardGameMechanicEntity,
                'mechanic',
                'mechanic.board_game_id = game.id AND mechanic.mechanic_id = :mechanicId',
                { mechanicId },
            ],
            ['getParameters'],
            ['getQuery'],
        ]);
        expect(query.drawSteps).toEqual([
            ['select', 'picked.id', 'id'],
            ['from', '(CANDIDATES)', 'picked'],
            ['orderBy', 'RAND()'],
            ['limit', 1],
            [
                'setParameters',
                { userId: 'user-1', level: 2, categoryId, mechanicId },
            ],
            ['getRawOne'],
        ]);
    });

    it('returns the drawn game with its categories and mechanics for the same user', async () => {
        const entity = drawnEntity();
        const query = new RecordingQuery(
            { id: entity.id },
            entity,
            [categoryId],
            [mechanicId],
        );

        const game = await new BoardGameRepository(
            query.dataSource(),
        ).drawForUser('user-1', { level: 3, categoryId, mechanicId });

        expect(query.findOneWhere).toEqual({ id: entity.id, userId: 'user-1' });
        expect(query.categoryWhere).toEqual({ boardGameId: In([entity.id]) });
        expect(query.mechanicWhere).toEqual({ boardGameId: In([entity.id]) });
        expect(game?.userId).toBe('user-1');
        expect(game?.categoryIds).toEqual([categoryId]);
        expect(game?.mechanicIds).toEqual([mechanicId]);
        expect(game?.name).toBe('Catan');
    });
});

class RecordingQuery {
    alias = '';
    readonly candidateSteps: unknown[][] = [];
    readonly drawSteps: unknown[][] = [];
    private readonly parameters: Record<string, unknown> = {};
    findOneWhere: unknown;
    categoryWhere: unknown;
    mechanicWhere: unknown;

    constructor(
        private readonly row?: { id: string },
        private readonly entity: BoardGameEntity | null = null,
        private readonly categoryIds: readonly string[] = [],
        private readonly mechanicIds: readonly string[] = [],
    ) {}

    dataSource(): DataSource {
        const games = {
            createQueryBuilder: (alias: string) => {
                this.alias = alias;
                return this.candidates();
            },
            findOne: async (options: { where: unknown }) => {
                this.findOneWhere = options.where;
                return this.entity;
            },
        };
        const categories = {
            find: async (options: { where: unknown }) => {
                this.categoryWhere = options.where;
                return this.categoryIds.map((id) => ({
                    boardGameId: this.row?.id,
                    categoryId: id,
                }));
            },
        };
        const mechanics = {
            find: async (options: { where: unknown }) => {
                this.mechanicWhere = options.where;
                return this.mechanicIds.map((id) => ({
                    boardGameId: this.row?.id,
                    mechanicId: id,
                }));
            },
        };
        return {
            manager: {
                getRepository: (target: unknown) => {
                    if (target === BoardGameEntity) {
                        return games;
                    }
                    if (target === BoardGameCategoryEntity) {
                        return categories;
                    }
                    if (target === BoardGameMechanicEntity) {
                        return mechanics;
                    }
                    throw new Error('Unexpected repository');
                },
                createQueryBuilder: () => this.draw(),
            },
        } as unknown as DataSource;
    }

    private candidates() {
        const record =
            (name: string, captureParameters = false) =>
            (...args: unknown[]) => {
                this.candidateSteps.push([name, ...args]);
                if (captureParameters) {
                    this.remember(args);
                }
                return this.candidates();
            };
        return {
            select: record('select'),
            distinct: record('distinct'),
            where: record('where', true),
            andWhere: record('andWhere', true),
            innerJoin: record('innerJoin', true),
            getParameters: () => {
                this.candidateSteps.push(['getParameters']);
                return { ...this.parameters };
            },
            getQuery: () => {
                this.candidateSteps.push(['getQuery']);
                return 'CANDIDATES';
            },
        };
    }

    private remember(args: readonly unknown[]) {
        const parameters = args.at(-1);
        if (parameters && typeof parameters === 'object') {
            Object.assign(this.parameters, parameters);
        }
    }

    private draw() {
        const builder = {
            select: (...args: unknown[]) => {
                this.drawSteps.push(['select', ...args]);
                return builder;
            },
            from: (...args: unknown[]) => {
                this.drawSteps.push(['from', ...args]);
                return builder;
            },
            orderBy: (...args: unknown[]) => {
                this.drawSteps.push(['orderBy', ...args]);
                return builder;
            },
            limit: (...args: unknown[]) => {
                this.drawSteps.push(['limit', ...args]);
                return builder;
            },
            setParameters: (...args: unknown[]) => {
                this.drawSteps.push(['setParameters', ...args]);
                return builder;
            },
            getRawOne: async () => {
                this.drawSteps.push(['getRawOne']);
                return this.row;
            },
        };
        return builder;
    }
}

function drawnEntity(): BoardGameEntity {
    const entity = new BoardGameEntity();
    entity.id = 'c3d4e5f6-a7b8-4901-c234-56789abcdef0';
    entity.userId = 'user-1';
    entity.name = 'Catan';
    entity.level = 3;
    entity.complexity = 2;
    entity.playTimeMinutes = 60;
    entity.minPlayers = 2;
    entity.maxPlayers = 4;
    entity.purchasedAt = '2026-05-10';
    entity.imageUrl = 'https://exemplo.com/catan.jpg';
    entity.createdAt = new Date('2026-05-11T00:00:00.000Z');
    entity.updatedAt = new Date('2026-05-11T00:00:00.000Z');
    return entity;
}
