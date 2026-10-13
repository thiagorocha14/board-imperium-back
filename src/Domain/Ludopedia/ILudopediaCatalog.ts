import type {
    LudopediaCatalogItem,
    LudopediaGameDetail,
    LudopediaGameSearch,
} from './LudopediaCatalog.js';

export const LUDOPEDIA_CATALOG = Symbol('LUDOPEDIA_CATALOG');

export interface ILudopediaCatalog {
    searchGames(input: {
        search: string;
        page: number;
        rows: number;
    }): Promise<LudopediaGameSearch>;
    getGame(ludopediaGameId: number): Promise<LudopediaGameDetail>;
    listCategories(): Promise<LudopediaCatalogItem[]>;
    listMechanics(): Promise<LudopediaCatalogItem[]>;
}
