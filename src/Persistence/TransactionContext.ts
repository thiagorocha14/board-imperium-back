import { AsyncLocalStorage } from 'node:async_hooks';
import type { EntityManager } from 'typeorm';

export const transactionContext = new AsyncLocalStorage<EntityManager>();
