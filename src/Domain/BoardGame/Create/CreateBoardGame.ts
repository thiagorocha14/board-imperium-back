import { Inject, Injectable } from '@nestjs/common';
import {
    CATEGORY_REPOSITORY,
    type ICategoryRepository,
} from '../../Category/ICategoryRepository.js';
import {
    MECHANIC_REPOSITORY,
    type IMechanicRepository,
} from '../../Mechanic/IMechanicRepository.js';
import { ConflictError } from '../../Shared/DomainError.js';
import { UNIT_OF_WORK, type IUnitOfWork } from '../../Shared/IUnitOfWork.js';
import { BoardGame, normalizeBoardGameName } from '../BoardGame.js';
import {
    assertMechanicsExist,
    assertOwnedCategories,
} from '../BoardGameLinks.js';
import {
    BOARD_GAME_REPOSITORY,
    type IBoardGameRepository,
} from '../IBoardGameRepository.js';

export interface CreateBoardGameInput {
    userId: string;
    name: string;
    level: number;
    complexity: number;
    playTimeMinutes: number;
    minPlayers: number;
    maxPlayers: number;
    purchasedAt: string | null;
    imageUrl: string | null;
    categoryIds: readonly string[];
    mechanicIds: readonly string[];
}

@Injectable()
export class CreateBoardGame {
    constructor(
        @Inject(BOARD_GAME_REPOSITORY)
        private readonly boardGames: IBoardGameRepository,
        @Inject(CATEGORY_REPOSITORY)
        private readonly categories: ICategoryRepository,
        @Inject(MECHANIC_REPOSITORY)
        private readonly mechanics: IMechanicRepository,
        @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
    ) {}

    async execute(input: CreateBoardGameInput): Promise<BoardGame> {
        const name = normalizeBoardGameName(input.name);
        return this.unitOfWork.run(async () => {
            await assertOwnedCategories(
                this.categories,
                input.userId,
                input.categoryIds,
            );
            await assertMechanicsExist(this.mechanics, input.mechanicIds);
            const existing = await this.boardGames.findByNameForUser(
                input.userId,
                name,
            );
            if (existing) {
                throw new ConflictError('Board game name already exists');
            }
            const game = BoardGame.create({ ...input, name, now: new Date() });
            await this.boardGames.save(game);
            return game;
        });
    }
}
