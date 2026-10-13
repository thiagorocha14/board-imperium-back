import { Inject, Injectable } from '@nestjs/common';
import { ValidationError } from '../../Shared/DomainError.js';
import type { LudopediaGameSearch } from '../LudopediaCatalog.js';
import {
    LUDOPEDIA_CATALOG,
    type ILudopediaCatalog,
} from '../ILudopediaCatalog.js';

const MIN_SEARCH_LENGTH = 2;
const DEFAULT_PAGE = 1;
const DEFAULT_ROWS = 10;
const MAX_ROWS = 20;

@Injectable()
export class SearchLudopediaGames {
    constructor(
        @Inject(LUDOPEDIA_CATALOG)
        private readonly catalog: ILudopediaCatalog,
    ) {}

    async execute(input: {
        search: string;
        page?: number;
        rows?: number;
    }): Promise<LudopediaGameSearch> {
        const search = input.search.trim();
        if (search.length < MIN_SEARCH_LENGTH) {
            throw new ValidationError(
                `Search must contain at least ${MIN_SEARCH_LENGTH} characters`,
            );
        }
        const page = input.page ?? DEFAULT_PAGE;
        const rows = input.rows ?? DEFAULT_ROWS;
        if (!Number.isInteger(page) || page < 1) {
            throw new ValidationError('Page must be an integer of at least 1');
        }
        if (!Number.isInteger(rows) || rows < 1 || rows > MAX_ROWS) {
            throw new ValidationError(
                `Rows must be an integer between 1 and ${MAX_ROWS}`,
            );
        }
        return this.catalog.searchGames({ search, page, rows });
    }
}
