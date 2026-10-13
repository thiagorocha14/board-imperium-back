import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../../../../src/Domain/Shared/DomainError.js';
import type { ILudopediaCatalog } from '../../../../../src/Domain/Ludopedia/ILudopediaCatalog.js';
import type { LudopediaGameDetail } from '../../../../../src/Domain/Ludopedia/LudopediaCatalog.js';
import { GetLudopediaGame } from '../../../../../src/Domain/Ludopedia/GetLudopediaGame/GetLudopediaGame.js';

const detail: LudopediaGameDetail = {
    id: 12,
    name: 'Azul',
    imageUrl: null,
    link: null,
    minPlayers: 2,
    maxPlayers: 4,
    playTimeMinutes: 45,
    publishedYear: 2017,
    minAge: 8,
    complexity: null,
    categories: [],
    mechanics: [],
};

describe('GetLudopediaGame', () => {
    it('rejects an id that is not a positive integer', async () => {
        const catalog = new RecordingCatalog();
        const getGame = new GetLudopediaGame(catalog);

        await expect(getGame.execute('0')).rejects.toBeInstanceOf(
            ValidationError,
        );
        await expect(getGame.execute('-3')).rejects.toBeInstanceOf(
            ValidationError,
        );
        await expect(getGame.execute('1.5')).rejects.toBeInstanceOf(
            ValidationError,
        );
        await expect(getGame.execute('abc')).rejects.toBeInstanceOf(
            ValidationError,
        );
        expect(catalog.ids).toEqual([]);
    });

    it('loads a positive integer id from the catalog', async () => {
        const catalog = new RecordingCatalog();
        const getGame = new GetLudopediaGame(catalog);

        await expect(getGame.execute('12')).resolves.toEqual(detail);
        expect(catalog.ids).toEqual([12]);
    });
});

class RecordingCatalog implements ILudopediaCatalog {
    ids: number[] = [];

    async searchGames(): Promise<never> {
        throw new Error('unexpected catalog call');
    }

    async getGame(id: number): Promise<LudopediaGameDetail> {
        this.ids.push(id);
        return detail;
    }

    async listCategories(): Promise<never> {
        throw new Error('unexpected catalog call');
    }

    async listMechanics(): Promise<never> {
        throw new Error('unexpected catalog call');
    }
}
