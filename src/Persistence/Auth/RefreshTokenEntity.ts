import {
    Column,
    Entity,
    ForeignKey,
    Index,
    PrimaryColumn,
    Unique,
} from 'typeorm';
import { UserEntity } from '../User/UserEntity.js';

@Entity('refresh_tokens')
@Unique('uq_refresh_tokens_token_hash', ['tokenHash'])
@Index('idx_refresh_tokens_user_id', ['userId'])
@Index('idx_refresh_tokens_family_id', ['familyId'])
export class RefreshTokenEntity {
    @PrimaryColumn({ type: 'char', length: 36 })
    id: string;

    @ForeignKey(() => UserEntity, {
        name: 'fk_refresh_tokens_user_id',
        onDelete: 'CASCADE',
    })
    @Column({ type: 'char', length: 36 })
    userId: string;

    @Column({ type: 'char', length: 36 })
    familyId: string;

    @Column({ type: 'char', length: 64 })
    tokenHash: string;

    @Column({ type: 'datetime', precision: 6 })
    expiresAt: Date;

    @Column({ type: 'datetime', precision: 6, nullable: true })
    revokedAt: Date | null;

    @Column({ type: 'char', length: 36, nullable: true })
    replacedById: string | null;

    @Column({ type: 'varchar', length: 512, nullable: true })
    userAgent: string | null;

    @Column({ type: 'datetime', precision: 6 })
    createdAt: Date;

    @Column({ type: 'datetime', precision: 6 })
    updatedAt: Date;
}
