import { Inject, Injectable } from '@nestjs/common';
import type { LudopediaCatalogItem } from '../LudopediaCatalog.js';
import {
    LUDOPEDIA_CATALOG,
    type ILudopediaCatalog,
} from '../ILudopediaCatalog.js';

@Injectable()
export class ListLudopediaCategories {
    constructor(
        @Inject(LUDOPEDIA_CATALOG)
        private readonly catalog: ILudopediaCatalog,
    ) {}

    async execute(): Promise<LudopediaCatalogItem[]> {
        return this.catalog.listCategories();
    }
}
