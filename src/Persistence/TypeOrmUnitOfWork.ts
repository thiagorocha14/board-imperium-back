import { Injectable } from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import type { IUnitOfWork } from '../Domain/Shared/IUnitOfWork.js';
import { transactionContext } from './TransactionContext.js';

@Injectable()
export class TypeOrmUnitOfWork implements IUnitOfWork {
    constructor(private readonly dataSource: DataSource) {}

    async run<T>(work: () => Promise<T>): Promise<T> {
        if (transactionContext.getStore()) {
            return work();
        }
        return this.dataSource.transaction((manager: EntityManager) =>
            transactionContext.run(manager, work),
        );
    }
}
