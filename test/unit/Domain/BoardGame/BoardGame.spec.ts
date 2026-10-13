import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../../../src/Domain/Shared/DomainError.js';
import { BoardGame } from '../../../../src/Domain/BoardGame/BoardGame.js';

const now = new Date('2026-10-09T12:00:00.000Z');

const valid = {
    userId: 'user-1',
    name: 'Brass Birmingham',
    level: 3,
    complexity: 3.88,
    playTimeMinutes: 120,
    minPlayers: 2,
    maxPlayers: 4,
    purchasedAt: '2024-05-01',
    imageUrl: 'https://cdn.example/covers/brass.jpg',
    categoryIds: [],
    mechanicIds: [],
    now,
};

describe('BoardGame', () => {
    it('accepts a game inside the player, complexity, and time limits', () => {
        const game = BoardGame.create(valid);
        expect(game.minPlayers).toBe(2);
        expect(game.maxPlayers).toBe(4);
        expect(game.level).toBe(3);
        expect(game.purchasedAt).toBe('2024-05-01');
        expect(game.imageUrl).toBe('https://cdn.example/covers/brass.jpg');
        expect(game.complexity).toBe(3.88);
        expect(game.playTimeMinutes).toBe(120);
    });

    it('rejects a maximum player count below the minimum', () => {
        expect(() =>
            BoardGame.create({ ...valid, minPlayers: 4, maxPlayers: 2 }),
        ).toThrow(ValidationError);
    });

    it('rejects fewer than one player', () => {
        expect(() =>
            BoardGame.create({ ...valid, minPlayers: 0, maxPlayers: 2 }),
        ).toThrow(ValidationError);
    });

    it('rejects complexity outside 1.00 to 5.00', () => {
        expect(() => BoardGame.create({ ...valid, complexity: 0.5 })).toThrow(
            ValidationError,
        );
        expect(() => BoardGame.create({ ...valid, complexity: 5.01 })).toThrow(
            ValidationError,
        );
    });

    it('rejects complexity with more than two decimal places', () => {
        expect(() => BoardGame.create({ ...valid, complexity: 2.345 })).toThrow(
            ValidationError,
        );
    });

    it('rejects a non-positive play time', () => {
        expect(() =>
            BoardGame.create({ ...valid, playTimeMinutes: 0 }),
        ).toThrow(ValidationError);
    });

    it('rejects an empty name', () => {
        expect(() => BoardGame.create({ ...valid, name: '   ' })).toThrow(
            ValidationError,
        );
    });

    it('keeps the player range valid when only one side is updated', () => {
        const game = BoardGame.create(valid);
        expect(() => game.update({ minPlayers: 5, now })).toThrow(
            ValidationError,
        );
    });

    it('accepts integer levels from 1 to 5', () => {
        for (const level of [1, 2, 3, 4, 5]) {
            expect(BoardGame.create({ ...valid, level }).level).toBe(level);
        }
    });

    it('rejects a level outside 1 to 5', () => {
        expect(() => BoardGame.create({ ...valid, level: 0 })).toThrow(
            ValidationError,
        );
        expect(() => BoardGame.create({ ...valid, level: 6 })).toThrow(
            ValidationError,
        );
    });

    it('rejects a non-integer level', () => {
        expect(() => BoardGame.create({ ...valid, level: 1.5 })).toThrow(
            ValidationError,
        );
        expect(() => BoardGame.create({ ...valid, level: 2.2 })).toThrow(
            ValidationError,
        );
    });

    it('rejects a textual level', () => {
        for (const level of ['Casual', 'Iniciante', 'A definir']) {
            expect(() =>
                BoardGame.create({
                    ...valid,
                    level: level as unknown as number,
                }),
            ).toThrow(ValidationError);
        }
    });

    it('rejects a missing level', () => {
        expect(() =>
            BoardGame.create({
                ...valid,
                level: undefined as unknown as number,
            }),
        ).toThrow(ValidationError);
        expect(() =>
            BoardGame.create({ ...valid, level: null as unknown as number }),
        ).toThrow(ValidationError);
    });

    it('rejects a future purchase date', () => {
        expect(() =>
            BoardGame.create({ ...valid, purchasedAt: '2026-10-10' }),
        ).toThrow(ValidationError);
    });

    it('rejects an invalid purchase date', () => {
        expect(() =>
            BoardGame.create({ ...valid, purchasedAt: '2026-02-31' }),
        ).toThrow(ValidationError);
    });

    it('rejects an invalid image URL', () => {
        expect(() =>
            BoardGame.create({ ...valid, imageUrl: 'not-a-url' }),
        ).toThrow(ValidationError);
        expect(() =>
            BoardGame.create({
                ...valid,
                imageUrl: 'https://user:pass@example.com/cover.jpg',
            }),
        ).toThrow(ValidationError);
    });

    it('stores a valid absolute image URL', () => {
        const game = BoardGame.create({
            ...valid,
            imageUrl: 'https://cdn.example/covers/azul.jpg',
        });
        expect(game.imageUrl).toBe('https://cdn.example/covers/azul.jpg');
    });

    it('rehydrates level, purchase date, and image', () => {
        for (const level of [1, 2, 3, 4, 5]) {
            expect(rehydrate({ level }).level).toBe(level);
        }
        const game = rehydrate({ level: 2 });
        expect(game.level).toBe(2);
        expect(game.purchasedAt).toBe('2018-03-04');
        expect(game.imageUrl).toBe('https://cdn.example/covers/azul.jpg');
    });

    it('rejects an invalid level when rehydrating', () => {
        expect(() => rehydrate({ level: 0 })).toThrow(ValidationError);
        expect(() => rehydrate({ level: 6 })).toThrow(ValidationError);
        expect(() => rehydrate({ level: 1.5 })).toThrow(ValidationError);
        expect(() =>
            rehydrate({ level: 'A definir' as unknown as number }),
        ).toThrow(ValidationError);
        expect(() =>
            rehydrate({ level: undefined as unknown as number }),
        ).toThrow(ValidationError);
    });

    it('updates the level when it is an integer from 1 to 5', () => {
        const game = BoardGame.create(valid);
        for (const level of [1, 2, 3, 4, 5]) {
            game.update({ level, now });
            expect(game.level).toBe(level);
        }
    });

    it('rejects clearing or replacing the level with an invalid value', () => {
        const game = BoardGame.create(valid);
        expect(() => game.update({ level: null, now })).toThrow(
            ValidationError,
        );
        expect(() => game.update({ level: 0, now })).toThrow(ValidationError);
        expect(() => game.update({ level: 6, now })).toThrow(ValidationError);
        expect(() => game.update({ level: 2.5, now })).toThrow(ValidationError);
        expect(() =>
            game.update({ level: 'Iniciante' as unknown as number, now }),
        ).toThrow(ValidationError);
        expect(game.level).toBe(3);
    });

    it('keeps a purchase date when omitted and clears it when set to null', () => {
        const game = BoardGame.create(valid);
        game.update({ name: 'Azul', now });
        expect(game.purchasedAt).toBe('2024-05-01');
        expect(game.imageUrl).toBe('https://cdn.example/covers/brass.jpg');
        game.update({ purchasedAt: null, imageUrl: null, now });
        expect(game.purchasedAt).toBeNull();
        expect(game.imageUrl).toBeNull();
        expect(game.level).toBe(3);
    });
});

function rehydrate(input: { level: number }): BoardGame {
    return BoardGame.rehydrate({
        id: 'game-1',
        userId: 'user-1',
        name: 'Azul',
        level: input.level,
        complexity: 1.8,
        playTimeMinutes: 45,
        minPlayers: 2,
        maxPlayers: 4,
        purchasedAt: '2018-03-04',
        imageUrl: 'https://cdn.example/covers/azul.jpg',
        categoryIds: [],
        mechanicIds: [],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
}
