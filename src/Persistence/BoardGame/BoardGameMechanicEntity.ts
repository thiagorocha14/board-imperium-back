import { Column, Entity, ForeignKey, Index, PrimaryColumn } from 'typeorm';
import { MechanicEntity } from '../Mechanic/MechanicEntity.js';
import { BoardGameEntity } from './BoardGameEntity.js';

@Entity('board_game_mechanics')
@Index('idx_board_game_mechanics_mechanic_id', ['mechanicId'])
export class BoardGameMechanicEntity {
    @ForeignKey(() => BoardGameEntity, {
        name: 'fk_board_game_mechanics_board_game_id',
        onDelete: 'CASCADE',
    })
    @PrimaryColumn({ type: 'char', length: 36 })
    boardGameId: string;

    @ForeignKey(() => MechanicEntity, {
        name: 'fk_board_game_mechanics_mechanic_id',
        onDelete: 'RESTRICT',
    })
    @PrimaryColumn({ type: 'char', length: 36 })
    mechanicId: string;

    @Column({ type: 'datetime', precision: 6 })
    createdAt: Date;

    @Column({ type: 'datetime', precision: 6 })
    updatedAt: Date;
}
