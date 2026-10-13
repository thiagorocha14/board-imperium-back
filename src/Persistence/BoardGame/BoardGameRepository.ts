import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import type { BoardGameDrawFilters } from '../../Domain/BoardGame/Draw/BoardGameDrawFilters.js';
import type { IBoardGameRepository } from '../../Domain/BoardGame/IBoardGameRepository.js';
import type { BoardGame } from '../../Domain/BoardGame/BoardGame.js';
import {
    ConflictError,
    NotFoundError,
    ValidationError,
} from '../../Domain/Shared/DomainError.js';
import type { Page } from '../../Domain/Shared/Page.js';
import {
    toBoardGame,
    toBoardGameEntity,
} from '../../Utils/Mappers/BoardGame/BoardGamePersistenceMapper.js';
import {
    isCheckViolation,
    isDuplicateKey,
    isForeignKeyViolation,
} from '../MysqlErrors.js';
import { transactionContext } from '../TransactionContext.js';
import { BoardGameCategoryEntity } from './BoardGameCategoryEntity.js';
import { BoardGameEntity } from './BoardGameEntity.js';
import { BoardGameMechanicEntity } from './BoardGameMechanicEntity.js';

@Injectable()
export class BoardGameRepository implements IBoardGameRepository {
    constructor(private readonly dataSource: DataSource) {}

    async findByIdForUser(
        id: string,
        userId: string,
    ): Promise<BoardGame | null> {
        const entity = await this.games().findOne({ where: { id, userId } });
        if (!entity) {
            return null;
        }
        const [game] = await this.withLinks([entity]);
        return game ?? null;
    }

    async findByNameForUser(
        userId: string,
        name: string,
    ): Promise<BoardGame | null> {
        const entity = await this.games().findOne({ where: { userId, name } });
        if (!entity) {
            return null;
        }
        const [game] = await this.withLinks([entity]);
        return game ?? null;
    }

    async findPageForUser(
        userId: string,
        page: number,
        pageSize: number,
    ): Promise<Page<BoardGame>> {
        const [entities, totalItems] = await this.games().findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return {
            items: await this.withLinks(entities),
            page,
            pageSize,
            totalItems,
        };
    }

    async findAllForUser(userId: string): Promise<BoardGame[]> {
        const entities = await this.games().find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
        return this.withLinks(entities);
    }

    async drawForUser(
        userId: string,
        filters: BoardGameDrawFilters,
    ): Promise<BoardGame | null> {
        const candidates = this.games()
            .createQueryBuilder('game')
            .select('game.id', 'id')
            .distinct(true)
            .where('game.user_id = :userId', { userId });

        if (filters.level !== undefined) {
            candidates.andWhere('game.level = :level', {
                level: filters.level,
            });
        }
        if (filters.categoryId !== undefined) {
            candidates.innerJoin(
                BoardGameCategoryEntity,
                'category',
                'category.board_game_id = game.id AND category.category_id = :categoryId',
                { categoryId: filters.categoryId },
            );
        }
        if (filters.mechanicId !== undefined) {
            candidates.innerJoin(
                BoardGameMechanicEntity,
                'mechanic',
                'mechanic.board_game_id = game.id AND mechanic.mechanic_id = :mechanicId',
                { mechanicId: filters.mechanicId },
            );
        }

        const parameters = candidates.getParameters();
        const row = await this.manager()
            .createQueryBuilder()
            .select('picked.id', 'id')
            .from(`(${candidates.getQuery()})`, 'picked')
            .orderBy('RAND()')
            .limit(1)
            .setParameters(parameters)
            .getRawOne<{ id?: string }>();

        if (!row?.id) {
            return null;
        }
        return this.findByIdForUser(row.id, userId);
    }

    async save(game: BoardGame): Promise<void> {
        const manager = this.manager();
        try {
            await manager
                .getRepository(BoardGameEntity)
                .save(toBoardGameEntity(game));
            await manager.getRepository(BoardGameCategoryEntity).delete({
                boardGameId: game.id,
            });
            await manager.getRepository(BoardGameMechanicEntity).delete({
                boardGameId: game.id,
            });
            if (game.categoryIds.length > 0) {
                await manager.getRepository(BoardGameCategoryEntity).insert(
                    game.categoryIds.map((categoryId) => ({
                        boardGameId: game.id,
                        categoryId,
                        createdAt: game.updatedAt,
                        updatedAt: game.updatedAt,
                    })),
                );
            }
            if (game.mechanicIds.length > 0) {
                await manager.getRepository(BoardGameMechanicEntity).insert(
                    game.mechanicIds.map((mechanicId) => ({
                        boardGameId: game.id,
                        mechanicId,
                        createdAt: game.updatedAt,
                        updatedAt: game.updatedAt,
                    })),
                );
            }
        } catch (error) {
            if (isDuplicateKey(error)) {
                throw new ConflictError('Board game name already exists');
            }
            if (isCheckViolation(error)) {
                throw new ValidationError(
                    'Board game data violates a constraint',
                );
            }
            if (isForeignKeyViolation(error)) {
                throw new NotFoundError('Related record not found');
            }
            throw error;
        }
    }

    async deleteForUser(id: string, userId: string): Promise<boolean> {
        const result = await this.games().delete({ id, userId });
        return (result.affected ?? 0) > 0;
    }

    private async withLinks(entities: BoardGameEntity[]): Promise<BoardGame[]> {
        if (entities.length === 0) {
            return [];
        }
        const ids = entities.map((entity) => entity.id);
        const categories = await this.manager()
            .getRepository(BoardGameCategoryEntity)
            .find({ where: { boardGameId: In(ids) } });
        const mechanics = await this.manager()
            .getRepository(BoardGameMechanicEntity)
            .find({ where: { boardGameId: In(ids) } });
        return entities.map((entity) =>
            toBoardGame(
                entity,
                categories
                    .filter((link) => link.boardGameId === entity.id)
                    .map((link) => link.categoryId),
                mechanics
                    .filter((link) => link.boardGameId === entity.id)
                    .map((link) => link.mechanicId),
            ),
        );
    }

    private games() {
        return this.manager().getRepository(BoardGameEntity);
    }

    private manager() {
        return transactionContext.getStore() ?? this.dataSource.manager;
    }
}
