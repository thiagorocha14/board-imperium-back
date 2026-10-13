import {
    Column,
    Entity,
    ForeignKey,
    Index,
    PrimaryColumn,
    Unique,
} from 'typeorm';
import { UserEntity } from '../User/UserEntity.js';

@Entity('user_identities')
@Unique('uq_user_identities_provider_subject', ['provider', 'providerSubject'])
@Index('idx_user_identities_user_id', ['userId'])
export class UserIdentityEntity {
    @PrimaryColumn({ type: 'char', length: 36 })
    id: string;

    @ForeignKey(() => UserEntity, {
        name: 'fk_user_identities_user_id',
        onDelete: 'CASCADE',
    })
    @Column({ type: 'char', length: 36 })
    userId: string;

    @Column({ type: 'varchar', length: 32 })
    provider: string;

    @Column({ type: 'varchar', length: 255 })
    providerSubject: string;

    @Column({ type: 'datetime', precision: 6 })
    createdAt: Date;

    @Column({ type: 'datetime', precision: 6 })
    updatedAt: Date;
}
