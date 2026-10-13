import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

@Entity('users')
@Unique('uq_users_email', ['email'])
export class UserEntity {
    @PrimaryColumn({ type: 'char', length: 36 })
    id: string;

    @Column({ type: 'varchar', length: 320 })
    email: string;

    @Column({ type: 'varchar', length: 120 })
    displayName: string;

    @Column({ type: 'varchar', length: 2048, nullable: true })
    avatarUrl: string | null;

    @Column({ type: 'datetime', precision: 6, nullable: true })
    lastLoginAt: Date | null;

    @Column({ type: 'datetime', precision: 6 })
    createdAt: Date;

    @Column({ type: 'datetime', precision: 6 })
    updatedAt: Date;
}
