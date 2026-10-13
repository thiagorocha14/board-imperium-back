import { Injectable, Logger } from '@nestjs/common';
import type { ILudopediaCatalog } from '../../../Domain/Ludopedia/ILudopediaCatalog.js';
import type {
    LudopediaCatalogItem,
    LudopediaGameDetail,
    LudopediaGameSearch,
    LudopediaGameSummary,
} from '../../../Domain/Ludopedia/LudopediaCatalog.js';
import {
    NotFoundError,
    ProviderUnavailableError,
} from '../../../Domain/Shared/DomainError.js';
import { Environment } from '../../../Environment.js';

const REQUEST_TIMEOUT_MS = 5_000;

@Injectable()
export class LudopediaHttpCatalog implements ILudopediaCatalog {
    private readonly logger = new Logger(LudopediaHttpCatalog.name);

    constructor(
        private readonly environment: Environment,
        private readonly fetchFn: typeof fetch = globalThis.fetch.bind(
            globalThis,
        ),
    ) {}

    async searchGames(input: {
        search: string;
        page: number;
        rows: number;
    }): Promise<LudopediaGameSearch> {
        const payload = await this.request('/jogos', {
            search: input.search,
            page: String(input.page),
            rows: String(input.rows),
            tp_jogo: 'b',
        });
        const record = asRecord(payload);
        const jogos = record?.jogos;
        const total = readCount(record?.total);
        if (!record || !Array.isArray(jogos) || total === null) {
            throw new ProviderUnavailableError();
        }
        return {
            games: jogos.flatMap((item) => {
                const game = readSummary(item);
                return game ? [game] : [];
            }),
            total,
        };
    }

    async getGame(ludopediaGameId: number): Promise<LudopediaGameDetail> {
        const payload = await this.request(
            `/jogos/${ludopediaGameId}`,
            {},
            { missing: new NotFoundError('Ludopedia game not found') },
        );
        const game = readDetail(payload);
        if (!game) {
            throw new ProviderUnavailableError();
        }
        return game;
    }

    async listCategories(): Promise<LudopediaCatalogItem[]> {
        const categories = await this.listNamed(
            '/categorias',
            'categorias',
            'id_categoria',
            'nm_categoria',
        );
        return withoutDeleted(categories);
    }

    async listMechanics(): Promise<LudopediaCatalogItem[]> {
        return this.listNamed(
            '/mecanicas',
            'mecanicas',
            'id_mecanica',
            'nm_mecanica',
        );
    }

    private async listNamed(
        path: string,
        listKey: string,
        idKey: string,
        nameKey: string,
    ): Promise<LudopediaCatalogItem[]> {
        const payload = await this.request(path, {});
        const record = asRecord(payload);
        const items = record?.[listKey];
        if (!record || !Array.isArray(items)) {
            throw new ProviderUnavailableError();
        }
        return items.flatMap((item) => {
            const named = readNamedItem(item, idKey, nameKey);
            return named ? [named] : [];
        });
    }

    private async request(
        path: string,
        query: Record<string, string>,
        options: { missing?: NotFoundError } = {},
    ): Promise<unknown> {
        if (!this.environment.ludopediaAccessToken) {
            throw new ProviderUnavailableError();
        }
        let response: Response;
        try {
            response = await this.fetchFn(this.url(path, query), {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.environment.ludopediaAccessToken}`,
                },
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });
        } catch (error) {
            this.logger.warn(
                `Ludopedia request failed (${error instanceof Error ? error.name : 'Error'})`,
            );
            throw new ProviderUnavailableError();
        }

        if (response.status === 404 && options.missing) {
            throw options.missing;
        }
        if (!response.ok) {
            this.logger.warn(`Ludopedia request failed (${response.status})`);
            throw new ProviderUnavailableError();
        }

        try {
            return (await response.json()) as unknown;
        } catch (error) {
            this.logger.warn(
                `Ludopedia request failed (${error instanceof Error ? error.name : 'Error'})`,
            );
            throw new ProviderUnavailableError();
        }
    }

    private url(path: string, query: Record<string, string>): string {
        const base = this.environment.ludopediaApiBaseUrl.endsWith('/')
            ? this.environment.ludopediaApiBaseUrl
            : `${this.environment.ludopediaApiBaseUrl}/`;
        const url = new URL(path.replace(/^\//, ''), base);
        for (const [key, value] of Object.entries(query)) {
            url.searchParams.set(key, value);
        }
        return url.toString();
    }
}

function readSummary(value: unknown): LudopediaGameSummary | null {
    const record = asRecord(value);
    if (!record) {
        return null;
    }
    const id = readPositiveInt(record.id_jogo);
    const name = readText(record.nm_jogo);
    if (id === null || name === null) {
        return null;
    }
    return {
        id,
        name,
        originalName: readText(record.nm_original),
        imageUrl: readText(record.thumb),
        link: readText(record.link),
    };
}

function readDetail(value: unknown): LudopediaGameDetail | null {
    const record = asRecord(value);
    if (!record) {
        return null;
    }
    const id = readPositiveInt(record.id_jogo);
    const name = readText(record.nm_jogo);
    if (id === null || name === null) {
        return null;
    }
    return {
        id,
        name,
        imageUrl: readText(record.thumb),
        link: readText(record.link),
        minPlayers: readInt(record.qt_jogadores_min),
        maxPlayers: readInt(record.qt_jogadores_max),
        playTimeMinutes: readInt(record.vl_tempo_jogo),
        publishedYear: readInt(record.ano_publicacao),
        minAge: readInt(record.idade_minima),
        complexity: readComplexity(
            asRecord(record.comunidade)?.vl_complexidade,
        ),
        categories: withoutDeleted(
            readNamedList(record.categorias, 'id_categoria', 'nm_categoria'),
        ),
        mechanics: readNamedList(
            record.mecanicas,
            'id_mecanica',
            'nm_mecanica',
        ),
    };
}

function withoutDeleted(items: LudopediaCatalogItem[]): LudopediaCatalogItem[] {
    return items.filter((item) => !item.name.endsWith('_deleted'));
}

function readNamedList(
    value: unknown,
    idKey: string,
    nameKey: string,
): LudopediaCatalogItem[] {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.flatMap((item) => {
        const named = readNamedItem(item, idKey, nameKey);
        return named ? [named] : [];
    });
}

function readNamedItem(
    value: unknown,
    idKey: string,
    nameKey: string,
): LudopediaCatalogItem | null {
    const record = asRecord(value);
    if (!record) {
        return null;
    }
    const id = readPositiveInt(record[idKey]);
    const name = readText(record[nameKey]);
    if (id === null || name === null) {
        return null;
    }
    return { id, name };
}

function readComplexity(value: unknown): number | null {
    if (value == null) {
        return null;
    }
    const text = typeof value === 'number' ? String(value) : value;
    if (typeof text !== 'string' || !/^\d+(\.\d+)?$/.test(text.trim())) {
        return null;
    }
    const parsed = Number(text.trim());
    if (parsed < 1 || parsed > 5) {
        return null;
    }
    const rounded = Number(parsed.toFixed(2));
    if (Math.abs(rounded - parsed) > 1e-8) {
        return null;
    }
    return rounded;
}

function readText(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function readInt(value: unknown): number | null {
    if (typeof value === 'number' && Number.isInteger(value)) {
        return value;
    }
    if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) {
        return Number(value.trim());
    }
    return null;
}

function readPositiveInt(value: unknown): number | null {
    const parsed = readInt(value);
    if (parsed === null || parsed < 1) {
        return null;
    }
    return parsed;
}

function readCount(value: unknown): number | null {
    const parsed = readInt(value);
    if (parsed === null || parsed < 0) {
        return null;
    }
    return parsed;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}
