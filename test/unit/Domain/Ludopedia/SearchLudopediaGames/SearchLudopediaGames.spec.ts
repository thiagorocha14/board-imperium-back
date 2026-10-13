import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../../../../src/Domain/Shared/DomainError.js';
import type { ILudopediaCatalog } from '../../../../../src/Domain/Ludopedia/ILudopediaCatalog.js';
import type { LudopediaGameSearch } from '../../../../../src/Domain/Ludopedia/LudopediaCatalog.js';
import { SearchLudopediaGames } from '../../../../../src/Domain/Ludopedia/SearchLudopediaGames/SearchLudopediaGames.js';

describe('SearchLudopediaGames', () => {
    it('rejects a search shorter than 2 characters without calling Ludopedia', async () => {
        const catalog = new RecordingCatalog();
        const search = new SearchLudopediaGames(catalog);

        await expect(search.execute({ search: ' a ' })).rejects.toBeInstanceOf(
            ValidationError,
        );
        expect(catalog.calls).toBe(0);
    });

    it('trims the search and defaults page and rows', async () => {
        const catalog = new RecordingCatalog();
        catalog.allowSearch = true;
        const search = new SearchLudopediaGames(catalog);

        await search.execute({ search: '  azul  ' });

        expect(catalog.lastSearch).toEqual({
            search: 'azul',
            page: 1,
            rows: 10,
        });
    });

    it('rejects more than 20 rows', async () => {
        const catalog = new RecordingCatalog();
        const search = new SearchLudopediaGames(catalog);

        await expect(
            search.execute({ search: 'azul', rows: 21 }),
        ).rejects.toBeInstanceOf(ValidationError);
        expect(catalog.calls).toBe(0);
    });
});

class RecordingCatalog implements ILudopediaCatalog {
    calls = 0;
    allowSearch = false;
    lastSearch: { search: string; page: number; rows: number } | null = null;

    async searchGames(input: {
        search: string;
        page: number;
        rows: number;
    }): Promise<LudopediaGameSearch> {
        this.calls += 1;
        this.lastSearch = input;
        if (!this.allowSearch) {
            throw new Error('unexpected catalog call');
        }
        return { games: [], total: 0 };
    }

    async getGame(): Promise<never> {
        throw new Error('unexpected catalog call');
    }

    async listCategories(): Promise<never> {
        throw new Error('unexpected catalog call');
    }

    async listMechanics(): Promise<never> {
        throw new Error('unexpected catalog call');
    }
}
