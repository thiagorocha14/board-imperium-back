import { Column, Entity, ForeignKey, PrimaryColumn } from 'typeorm';
import { UserEntity } from '../User/UserEntity.js';

@Entity('user_credentials')
export class UserCredentialEntity {
    @PrimaryColumn({ type: 'char', length: 36 })
    @ForeignKey(() => UserEntity, {
        name: 'fk_user_credentials_user_id',
        onDelete: 'CASCADE',
    })
    userId: string;

    @Column({ type: 'varchar', length: 512 })
    passwordHash: string;

    @Column({ type: 'datetime', precision: 6 })
    createdAt: Date;

    @Column({ type: 'datetime', precision: 6 })
    updatedAt: Date;
}
