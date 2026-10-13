import type { Mechanic } from './Mechanic.js';

export const MECHANIC_REPOSITORY = Symbol('MECHANIC_REPOSITORY');

export interface IMechanicRepository {
    findByIds(ids: readonly string[]): Promise<Mechanic[]>;
    list(): Promise<Mechanic[]>;
}
