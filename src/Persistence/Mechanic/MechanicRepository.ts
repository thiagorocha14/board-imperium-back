import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import type { IMechanicRepository } from '../../Domain/Mechanic/IMechanicRepository.js';
import type { Mechanic } from '../../Domain/Mechanic/Mechanic.js';
import { toMechanic } from '../../Utils/Mappers/Mechanic/MechanicPersistenceMapper.js';
import { MechanicEntity } from './MechanicEntity.js';

@Injectable()
export class MechanicRepository implements IMechanicRepository {
    constructor(private readonly dataSource: DataSource) {}

    async findByIds(ids: readonly string[]): Promise<Mechanic[]> {
        if (ids.length === 0) {
            return [];
        }
        const entities = await this.dataSource
            .getRepository(MechanicEntity)
            .find({
                where: { id: In([...ids]) },
            });
        return entities.map(toMechanic);
    }

    async list(): Promise<Mechanic[]> {
        const entities = await this.dataSource
            .getRepository(MechanicEntity)
            .find({
                order: { name: 'ASC' },
            });
        return entities.map(toMechanic);
    }
}
