import { describe, expect, it, vi } from 'vitest';
import {
    NotFoundError,
    ProviderUnavailableError,
} from '../../../../../src/Domain/Shared/DomainError.js';
import { Environment } from '../../../../../src/Environment.js';
import { LudopediaHttpCatalog } from '../../../../../src/Infrastructure/Clients/Ludopedia/LudopediaHttpCatalog.js';

const TOKEN = 'test-token';
const REMOTE_BODY = 'upstream-secret-body';

describe('LudopediaHttpCatalog', () => {
    it('searches base games and maps the summary', async () => {
        const fetchFn = vi.fn<typeof fetch>(async () =>
            json(200, {
                jogos: [
                    {
                        id_jogo: 397,
                        nm_jogo: 'Catan',
                        nm_original: 'The Settlers of Catan',
                        thumb: 'https://cdn.example/397_t.jpg',
                        link: 'https://ludopedia.test/jogo/catan',
                    },
                    { id_jogo: 1, nm_jogo: '   ' },
                ],
                total: 2,
            }),
        );
        const catalog = new LudopediaHttpCatalog(testEnvironment(), fetchFn);

        await expect(
            catalog.searchGames({ search: 'catan', page: 1, rows: 10 }),
        ).resolves.toEqual({
            games: [
                {
                    id: 397,
                    name: 'Catan',
                    originalName: 'The Settlers of Catan',
                    imageUrl: 'https://cdn.example/397_t.jpg',
                    link: 'https://ludopedia.test/jogo/catan',
                },
            ],
            total: 2,
        });

        const [url, init] = fetchFn.mock.calls[0] ?? [];
        expect(requestUrl(url)).toBe(
            'https://ludopedia.test/api/v1/jogos?search=catan&page=1&rows=10&tp_jogo=b',
        );
        expect(new Headers(init?.headers).get('authorization')).toBe(
            `Bearer ${TOKEN}`,
        );
        expect(requestUrl(url)).not.toContain(TOKEN);
    });

    it('maps a game detail from the remote payload', async () => {
        const fetchFn = vi.fn<typeof fetch>(async () =>
            json(200, {
                id_jogo: 404,
                nm_jogo: 'Terra Mystica',
                thumb: 'https://cdn.example/404_t.jpg',
                link: 'https://ludopedia.test/jogo/terra-mystica',
                qt_jogadores_min: 2,
                qt_jogadores_max: 5,
                vl_tempo_jogo: 100,
                ano_publicacao: 2012,
                idade_minima: 12,
                comunidade: { vl_complexidade: '3.50' },
                categorias: [
                    { id_categoria: 1, nm_categoria: 'Estratégia' },
                    { id_categoria: 9, nm_categoria: 'Fantasia_deleted' },
                ],
                mecanicas: [
                    {
                        id_mecanica: 2,
                        nm_mecanica: 'Colocação de trabalhadores',
                    },
                ],
                temas: [{ id_tema: 9, nm_tema: 'Fantasia' }],
            }),
        );
        const catalog = new LudopediaHttpCatalog(testEnvironment(), fetchFn);

        await expect(catalog.getGame(404)).resolves.toEqual({
            id: 404,
            name: 'Terra Mystica',
            imageUrl: 'https://cdn.example/404_t.jpg',
            link: 'https://ludopedia.test/jogo/terra-mystica',
            minPlayers: 2,
            maxPlayers: 5,
            playTimeMinutes: 100,
            publishedYear: 2012,
            minAge: 12,
            complexity: 3.5,
            categories: [{ id: 1, name: 'Estratégia' }],
            mechanics: [{ id: 2, name: 'Colocação de trabalhadores' }],
        });
        expect(requestUrl(fetchFn.mock.calls[0]?.[0])).toBe(
            'https://ludopedia.test/api/v1/jogos/404',
        );
    });

    it('returns null complexity when the community value is outside 1 to 5', async () => {
        const fetchFn = vi.fn<typeof fetch>(async () =>
            json(200, {
                id_jogo: 1,
                nm_jogo: 'Azul',
                comunidade: { vl_complexidade: '5.01' },
            }),
        );
        const catalog = new LudopediaHttpCatalog(testEnvironment(), fetchFn);

        await expect(catalog.getGame(1)).resolves.toMatchObject({
            complexity: null,
            categories: [],
            mechanics: [],
        });
    });

    it('maps a missing game to not found without the remote body', async () => {
        const fetchFn = vi.fn<typeof fetch>(async () => text(404, REMOTE_BODY));
        const catalog = new LudopediaHttpCatalog(testEnvironment(), fetchFn);

        await expect(catalog.getGame(999)).rejects.toEqual(
            expect.objectContaining({
                name: 'NotFoundError',
                message: 'Ludopedia game not found',
            }),
        );
        await expect(catalog.getGame(999)).rejects.toBeInstanceOf(
            NotFoundError,
        );
        await expect(catalog.getGame(999)).rejects.not.toThrow(REMOTE_BODY);
    });

    it('lists categories', async () => {
        const fetchFn = vi.fn<typeof fetch>(async () =>
            json(200, {
                categorias: [
                    { id_categoria: 1, nm_categoria: 'Fantasia' },
                    { id_categoria: 2, nm_categoria: '   ' },
                    { id_categoria: 3, nm_categoria: 'Guerra_deleted' },
                ],
            }),
        );
        const catalog = new LudopediaHttpCatalog(testEnvironment(), fetchFn);

        await expect(catalog.listCategories()).resolves.toEqual([
            { id: 1, name: 'Fantasia' },
        ]);
        expect(requestUrl(fetchFn.mock.calls[0]?.[0])).toBe(
            'https://ludopedia.test/api/v1/categorias',
        );
    });

    it('lists mechanics', async () => {
        const fetchFn = vi.fn<typeof fetch>(async () =>
            json(200, {
                mecanicas: [
                    {
                        id_mecanica: 2,
                        nm_mecanica: 'Alocação de Trabalhadores',
                    },
                ],
            }),
        );
        const catalog = new LudopediaHttpCatalog(testEnvironment(), fetchFn);

        await expect(catalog.listMechanics()).resolves.toEqual([
            { id: 2, name: 'Alocação de Trabalhadores' },
        ]);
        expect(requestUrl(fetchFn.mock.calls[0]?.[0])).toBe(
            'https://ludopedia.test/api/v1/mecanicas',
        );
    });

    it('maps network failures to a provider error without remote details', async () => {
        const fetchFn = vi.fn<typeof fetch>(async () => {
            throw new Error(`ECONNRESET ${TOKEN} ${REMOTE_BODY}`);
        });
        const catalog = new LudopediaHttpCatalog(testEnvironment(), fetchFn);

        await expect(
            catalog.searchGames({ search: 'azul', page: 1, rows: 10 }),
        ).rejects.toBeInstanceOf(ProviderUnavailableError);
        await expect(
            catalog.searchGames({ search: 'azul', page: 1, rows: 10 }),
        ).rejects.toThrow('Catalog provider is unavailable');
    });

    it('maps an unauthorized remote response without its body', async () => {
        const fetchFn = vi.fn<typeof fetch>(async () => text(401, REMOTE_BODY));
        const catalog = new LudopediaHttpCatalog(testEnvironment(), fetchFn);

        await expect(catalog.listCategories()).rejects.toEqual(
            expect.objectContaining({
                name: 'ProviderUnavailableError',
                message: 'Catalog provider is unavailable',
            }),
        );
    });
});

function requestUrl(input: unknown): string {
    if (typeof input === 'string') {
        return input;
    }
    if (input instanceof URL) {
        return input.href;
    }
    if (input instanceof Request) {
        return input.url;
    }
    return '';
}

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function text(status: number, body: string): Response {
    return new Response(body, { status });
}

function testEnvironment(): Environment {
    return Environment.load({
        NODE_ENV: 'test',
        PORT: '3000',
        FRONT_URL: 'http://localhost:4200',
        DB_HOST: 'mysql',
        DB_PORT: '3306',
        DB_NAME: 'board_imperium',
        DB_USER: 'board',
        DB_PASSWORD: 'board-secret',
        GOOGLE_CLIENT_ID: 'google-client',
        GOOGLE_CLIENT_SECRET: 'google-secret',
        GOOGLE_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
        JWT_ACCESS_SECRET: 'x'.repeat(48),
        JWT_ACCESS_TTL: '15m',
        REFRESH_TOKEN_TTL: '30d',
        COOKIE_SECURE: 'false',
        LUDOPEDIA_API_BASE_URL: 'https://ludopedia.test/api/v1',
        LUDOPEDIA_ACCESS_TOKEN: TOKEN,
    });
}
