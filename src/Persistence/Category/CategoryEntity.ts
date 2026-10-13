import { Column, Entity, ForeignKey, PrimaryColumn, Unique } from 'typeorm';
import { UserEntity } from '../User/UserEntity.js';

@Entity('categories')
@Unique('uq_categories_user_name', ['userId', 'name'])
export class CategoryEntity {
    @PrimaryColumn({ type: 'char', length: 36 })
    id: string;

    @ForeignKey(() => UserEntity, {
        name: 'fk_categories_user_id',
        onDelete: 'CASCADE',
    })
    @Column({ type: 'char', length: 36 })
    userId: string;

    @Column({ type: 'varchar', length: 80 })
    name: string;

    @Column({ type: 'datetime', precision: 6 })
    createdAt: Date;

    @Column({ type: 'datetime', precision: 6 })
    updatedAt: Date;
}
