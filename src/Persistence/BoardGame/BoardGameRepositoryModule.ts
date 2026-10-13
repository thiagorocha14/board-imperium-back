import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BOARD_GAME_REPOSITORY } from '../../Domain/BoardGame/IBoardGameRepository.js';
import { BoardGameCategoryEntity } from './BoardGameCategoryEntity.js';
import { BoardGameEntity } from './BoardGameEntity.js';
import { BoardGameMechanicEntity } from './BoardGameMechanicEntity.js';
import { BoardGameRepository } from './BoardGameRepository.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            BoardGameEntity,
            BoardGameCategoryEntity,
            BoardGameMechanicEntity,
        ]),
    ],
    providers: [
        { provide: BOARD_GAME_REPOSITORY, useClass: BoardGameRepository },
    ],
    exports: [BOARD_GAME_REPOSITORY],
})
export class BoardGameRepositoryModule {}
