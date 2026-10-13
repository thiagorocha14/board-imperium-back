import { Column, Entity, ForeignKey, Index, PrimaryColumn } from 'typeorm';
import { CategoryEntity } from '../Category/CategoryEntity.js';
import { BoardGameEntity } from './BoardGameEntity.js';

@Entity('board_game_categories')
@Index('idx_board_game_categories_category_id', ['categoryId'])
export class BoardGameCategoryEntity {
    @ForeignKey(() => BoardGameEntity, {
        name: 'fk_board_game_categories_board_game_id',
        onDelete: 'CASCADE',
    })
    @PrimaryColumn({ type: 'char', length: 36 })
    boardGameId: string;

    @ForeignKey(() => CategoryEntity, {
        name: 'fk_board_game_categories_category_id',
        onDelete: 'CASCADE',
    })
    @PrimaryColumn({ type: 'char', length: 36 })
    categoryId: string;

    @Column({ type: 'datetime', precision: 6 })
    createdAt: Date;

    @Column({ type: 'datetime', precision: 6 })
    updatedAt: Date;
}
