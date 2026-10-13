import { Complexity } from '../Shared/Complexity.js';
import { createId } from '../Shared/createId.js';
import { ValidationError } from '../Shared/DomainError.js';
import { PlayerRange } from '../Shared/PlayerRange.js';
import { GameImage } from './GameImage.js';
import { Level } from './Level.js';
import { PurchaseDate } from './PurchaseDate.js';

export const BOARD_GAME_NAME_MAX = 150;

export class BoardGame {
    private constructor(
        readonly id: string,
        readonly userId: string,
        private nameValue: string,
        private levelValue: Level,
        private complexityValue: Complexity,
        private playTimeMinutesValue: number,
        private players: PlayerRange,
        private purchasedAtValue: PurchaseDate | null,
        private imageValue: GameImage | null,
        private categoryIdValues: readonly string[],
        private mechanicIdValues: readonly string[],
        readonly createdAt: Date,
        private updatedAtValue: Date,
    ) {}

    static create(input: {
        userId: string;
        name: string;
        level: number;
        complexity: number;
        playTimeMinutes: number;
        minPlayers: number;
        maxPlayers: number;
        purchasedAt?: string | null;
        imageUrl?: string | null;
        categoryIds: readonly string[];
        mechanicIds: readonly string[];
        now?: Date;
    }): BoardGame {
        const now = input.now ?? new Date();
        const name = normalizeBoardGameName(input.name);
        const level = Level.create(input.level);
        const complexity = Complexity.create(input.complexity);
        const playTimeMinutes = assertPlayTime(input.playTimeMinutes);
        const players = PlayerRange.create(input.minPlayers, input.maxPlayers);
        const purchasedAt = purchaseDateFromInput(input.purchasedAt, now);
        const image = gameImageFromInput(input.imageUrl);
        return new BoardGame(
            createId(),
            input.userId,
            name,
            level,
            complexity,
            playTimeMinutes,
            players,
            purchasedAt,
            image,
            uniqueIds(input.categoryIds),
            uniqueIds(input.mechanicIds),
            now,
            now,
        );
    }

    static rehydrate(input: {
        id: string;
        userId: string;
        name: string;
        level: number;
        complexity: number;
        playTimeMinutes: number;
        minPlayers: number;
        maxPlayers: number;
        purchasedAt: string | null;
        imageUrl: string | null;
        categoryIds: readonly string[];
        mechanicIds: readonly string[];
        createdAt: Date;
        updatedAt: Date;
    }): BoardGame {
        return new BoardGame(
            input.id,
            input.userId,
            input.name,
            Level.create(input.level),
            Complexity.create(input.complexity),
            input.playTimeMinutes,
            PlayerRange.create(input.minPlayers, input.maxPlayers),
            input.purchasedAt === null
                ? null
                : PurchaseDate.parse(input.purchasedAt),
            input.imageUrl === null ? null : GameImage.create(input.imageUrl),
            input.categoryIds,
            input.mechanicIds,
            input.createdAt,
            input.updatedAt,
        );
    }

    get name(): string {
        return this.nameValue;
    }

    get level(): number {
        return this.levelValue.value;
    }

    get complexity(): number {
        return this.complexityValue.value;
    }

    get playTimeMinutes(): number {
        return this.playTimeMinutesValue;
    }

    get minPlayers(): number {
        return this.players.min;
    }

    get maxPlayers(): number {
        return this.players.max;
    }

    get purchasedAt(): string | null {
        return this.purchasedAtValue?.value ?? null;
    }

    get imageUrl(): string | null {
        return this.imageValue?.url ?? null;
    }

    get categoryIds(): readonly string[] {
        return [...this.categoryIdValues];
    }

    get mechanicIds(): readonly string[] {
        return [...this.mechanicIdValues];
    }

    get updatedAt(): Date {
        return this.updatedAtValue;
    }

    update(input: {
        name?: string;
        level?: number | null;
        complexity?: number;
        playTimeMinutes?: number;
        minPlayers?: number;
        maxPlayers?: number;
        purchasedAt?: string | null;
        imageUrl?: string | null;
        categoryIds?: readonly string[];
        mechanicIds?: readonly string[];
        now: Date;
    }): void {
        if (input.name !== undefined) {
            this.nameValue = normalizeBoardGameName(input.name);
        }
        if (input.level !== undefined) {
            if (input.level === null) {
                throw new ValidationError('Level is required');
            }
            this.levelValue = Level.create(input.level);
        }
        if (input.complexity !== undefined) {
            this.complexityValue = Complexity.create(input.complexity);
        }
        if (input.playTimeMinutes !== undefined) {
            this.playTimeMinutesValue = assertPlayTime(input.playTimeMinutes);
        }
        if (input.minPlayers !== undefined || input.maxPlayers !== undefined) {
            this.players = PlayerRange.create(
                input.minPlayers ?? this.players.min,
                input.maxPlayers ?? this.players.max,
            );
        }
        if (input.purchasedAt !== undefined) {
            this.purchasedAtValue = purchaseDateFromInput(
                input.purchasedAt,
                input.now,
            );
        }
        if (input.imageUrl !== undefined) {
            this.imageValue = gameImageFromInput(input.imageUrl);
        }
        if (input.categoryIds !== undefined) {
            this.categoryIdValues = uniqueIds(input.categoryIds);
        }
        if (input.mechanicIds !== undefined) {
            this.mechanicIdValues = uniqueIds(input.mechanicIds);
        }
        this.updatedAtValue = input.now;
    }
}

export function normalizeBoardGameName(name: string): string {
    const normalized = name.trim();
    if (normalized.length === 0 || normalized.length > BOARD_GAME_NAME_MAX) {
        throw new ValidationError(
            `Board game name must be between 1 and ${BOARD_GAME_NAME_MAX} characters`,
        );
    }
    return normalized;
}

function purchaseDateFromInput(
    value: string | null | undefined,
    now: Date,
): PurchaseDate | null {
    if (value == null) {
        return null;
    }
    return PurchaseDate.create(value, now);
}

function gameImageFromInput(
    value: string | null | undefined,
): GameImage | null {
    if (value == null) {
        return null;
    }
    return GameImage.create(value);
}

function assertPlayTime(playTimeMinutes: number): number {
    if (!Number.isInteger(playTimeMinutes) || playTimeMinutes <= 0) {
        throw new ValidationError(
            'Play time must be a positive number of minutes',
        );
    }
    return playTimeMinutes;
}

function uniqueIds(ids: readonly string[]): string[] {
    return [...new Set(ids)];
}
