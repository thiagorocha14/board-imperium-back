import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { DrawBoardGameQueryDTO } from '../../../../../src/API/BoardGame/Draw/DrawBoardGameQueryDTO.js';

const categoryId = '6f1b7c2e-8a4d-4e1a-9c3b-2d5f6a7b8c9d';
const mechanicId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

describe('GET /board-games/draw query', () => {
    it('accepts an empty query and integer levels from 1 to 5', async () => {
        expect(await invalidProperties({})).toEqual([]);
        for (const level of ['1', '2', '3', '4', '5']) {
            expect(await invalidProperties({ level })).toEqual([]);
        }
    });

    it('accepts category and mechanic ids that are uuids', async () => {
        const dto = plainToInstance(DrawBoardGameQueryDTO, {
            level: '2',
            categoryId,
            mechanicId,
        });

        expect(dto.level).toBe(2);
        expect(await validate(dto)).toEqual([]);
    });

    it('rejects levels outside 1 to 5, decimals and text', async () => {
        for (const level of ['0', '6', '1.5', '3.2', 'Casual', 'abc']) {
            expect(await invalidProperties({ level })).toContain('level');
        }
    });

    it('rejects category and mechanic ids that are not uuids', async () => {
        expect(
            await invalidProperties({
                categoryId: 'categoria',
                mechanicId: '123',
            }),
        ).toEqual(['categoryId', 'mechanicId']);
    });
});

async function invalidProperties(
    query: Record<string, unknown>,
): Promise<string[]> {
    const dto = plainToInstance(DrawBoardGameQueryDTO, query);
    const errors = await validate(dto);
    return errors.map((error) => error.property);
}
