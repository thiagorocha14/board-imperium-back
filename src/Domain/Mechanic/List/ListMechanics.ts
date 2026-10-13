import { Inject, Injectable } from '@nestjs/common';
import {
    MECHANIC_REPOSITORY,
    type IMechanicRepository,
} from '../IMechanicRepository.js';
import type { Mechanic } from '../Mechanic.js';

@Injectable()
export class ListMechanics {
    constructor(
        @Inject(MECHANIC_REPOSITORY)
        private readonly mechanics: IMechanicRepository,
    ) {}

    async execute(): Promise<Mechanic[]> {
        return this.mechanics.list();
    }
}
