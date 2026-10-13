import { Inject, Injectable } from '@nestjs/common';
import { ValidationError } from '../../Shared/DomainError.js';
import type { LudopediaGameDetail } from '../LudopediaCatalog.js';
import {
    LUDOPEDIA_CATALOG,
    type ILudopediaCatalog,
} from '../ILudopediaCatalog.js';

@Injectable()
export class GetLudopediaGame {
    constructor(
        @Inject(LUDOPEDIA_CATALOG)
        private readonly catalog: ILudopediaCatalog,
    ) {}

    async execute(ludopediaGameId: string): Promise<LudopediaGameDetail> {
        if (!/^[1-9]\d*$/.test(ludopediaGameId)) {
            throw new ValidationError(
                'Ludopedia game id must be a positive integer',
            );
        }
        const id = Number(ludopediaGameId);
        if (!Number.isSafeInteger(id)) {
            throw new ValidationError(
                'Ludopedia game id must be a positive integer',
            );
        }
        return this.catalog.getGame(id);
    }
}
