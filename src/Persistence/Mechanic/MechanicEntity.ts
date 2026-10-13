import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

@Entity('mechanics')
@Unique('uq_mechanics_name', ['name'])
export class MechanicEntity {
    @PrimaryColumn({ type: 'char', length: 36 })
    id: string;

    @Column({ type: 'varchar', length: 80 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'datetime', precision: 6 })
    createdAt: Date;

    @Column({ type: 'datetime', precision: 6 })
    updatedAt: Date;
}
