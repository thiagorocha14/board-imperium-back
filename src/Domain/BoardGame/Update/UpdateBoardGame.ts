import { Inject, Injectable } from '@nestjs/common';
import {
    CATEGORY_REPOSITORY,
    type ICategoryRepository,
} from '../../Category/ICategoryRepository.js';
import {
    MECHANIC_REPOSITORY,
    type IMechanicRepository,
} from '../../Mechanic/IMechanicRepository.js';
import { ConflictError, NotFoundError } from '../../Shared/DomainError.js';
import { UNIT_OF_WORK, type IUnitOfWork } from '../../Shared/IUnitOfWork.js';
import { normalizeBoardGameName, type BoardGame } from '../BoardGame.js';
import {
    assertMechanicsExist,
    assertOwnedCategories,
} from '../BoardGameLinks.js';
import {
    BOARD_GAME_REPOSITORY,
    type IBoardGameRepository,
} from '../IBoardGameRepository.js';

export interface UpdateBoardGameInput {
    userId: string;
    boardGameId: string;
    name?: string;
    level?: number | null;
    complexity?: number;
    playTimeMinutes?: number;
    minPlayers?: number;
    maxPlayers?: number;
    purchasedAt?: string | null;
    imageUrl?: string | null;
    categoryIds?: readonly string[];
    mechanicIds?: readonly string[];
}

@Injectable()
export class UpdateBoardGame {
    constructor(
        @Inject(BOARD_GAME_REPOSITORY)
        private readonly boardGames: IBoardGameRepository,
        @Inject(CATEGORY_REPOSITORY)
        private readonly categories: ICategoryRepository,
        @Inject(MECHANIC_REPOSITORY)
        private readonly mechanics: IMechanicRepository,
        @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
    ) {}

    async execute(input: UpdateBoardGameInput): Promise<BoardGame> {
        return this.unitOfWork.run(async () => {
            const game = await this.boardGames.findByIdForUser(
                input.boardGameId,
                input.userId,
            );
            if (!game) {
                throw new NotFoundError('Board game not found');
            }

            if (input.categoryIds) {
                await assertOwnedCategories(
                    this.categories,
                    input.userId,
                    input.categoryIds,
                );
            }
            if (input.mechanicIds) {
                await assertMechanicsExist(this.mechanics, input.mechanicIds);
            }
            if (input.name !== undefined) {
                const name = normalizeBoardGameName(input.name);
                if (name.toLowerCase() !== game.name.toLowerCase()) {
                    const other = await this.boardGames.findByNameForUser(
                        input.userId,
                        name,
                    );
                    if (other && other.id !== game.id) {
                        throw new ConflictError(
                            'Board game name already exists',
                        );
                    }
                }
            }

            game.update({ ...input, now: new Date() });
            await this.boardGames.save(game);
            return game;
        });
    }
}
