import {
    Check,
    Column,
    Entity,
    ForeignKey,
    PrimaryColumn,
    Unique,
} from 'typeorm';
import { UserEntity } from '../User/UserEntity.js';

const decimalTransformer = {
    to: (value: number): string => value.toFixed(2),
    from: (value: string | null): number =>
        value === null ? 0 : Number(value),
};

const dateOnlyTransformer = {
    to: (value: string | null): string | null => value,
    from: (value: string | Date | null): string | null => {
        if (value == null) {
            return null;
        }
        if (value instanceof Date) {
            const year = value.getUTCFullYear();
            const month = String(value.getUTCMonth() + 1).padStart(2, '0');
            const day = String(value.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return value.slice(0, 10);
    },
};

@Entity('board_games')
@Unique('uq_board_games_user_name', ['userId', 'name'])
@Check('chk_board_games_complexity', '`complexity` BETWEEN 1 AND 5')
@Check('chk_board_games_play_time', '`play_time_minutes` > 0')
@Check('chk_board_games_min_players', '`min_players` >= 1')
@Check('chk_board_games_max_players', '`max_players` >= `min_players`')
@Check('chk_board_games_level', '`level` BETWEEN 1 AND 5')
export class BoardGameEntity {
    @PrimaryColumn({ type: 'char', length: 36 })
    id: string;

    @ForeignKey(() => UserEntity, {
        name: 'fk_board_games_user_id',
        onDelete: 'CASCADE',
    })
    @Column({ type: 'char', length: 36 })
    userId: string;

    @Column({ type: 'varchar', length: 150 })
    name: string;

    @Column({ type: 'int' })
    level: number;

    @Column({
        type: 'date',
        nullable: true,
        transformer: dateOnlyTransformer,
    })
    purchasedAt: string | null;

    @Column({ type: 'varchar', length: 2048, nullable: true })
    imageUrl: string | null;

    @Column({
        type: 'decimal',
        precision: 3,
        scale: 2,
        transformer: decimalTransformer,
    })
    complexity: number;

    @Column({ type: 'int' })
    playTimeMinutes: number;

    @Column({ type: 'int' })
    minPlayers: number;

    @Column({ type: 'int' })
    maxPlayers: number;

    @Column({ type: 'datetime', precision: 6 })
    createdAt: Date;

    @Column({ type: 'datetime', precision: 6 })
    updatedAt: Date;
}
