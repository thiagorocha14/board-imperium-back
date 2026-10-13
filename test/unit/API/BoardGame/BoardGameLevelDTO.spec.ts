import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateBoardGameDTO } from '../../../../src/API/BoardGame/Create/CreateBoardGameDTO.js';
import { UpdateBoardGameDTO } from '../../../../src/API/BoardGame/Update/UpdateBoardGameDTO.js';

describe('board game level on create and update', () => {
    it('accepts integer levels from 1 to 5', async () => {
        for (const level of [1, 2, 3, 4, 5]) {
            expect(await levelError(createDto(level))).toBe(false);
            expect(await levelError(updateDto(level))).toBe(false);
        }
    });

    it('rejects 0, 6, decimals, and text', async () => {
        for (const level of [
            0,
            6,
            1.5,
            3.2,
            'Casual',
            'Iniciante',
            'A definir',
        ]) {
            expect(await levelError(createDto(level))).toBe(true);
            expect(await levelError(updateDto(level))).toBe(true);
        }
    });

    it('requires a level on create and rejects a missing level on update', async () => {
        const created = new CreateBoardGameDTO();
        created.name = 'Catan';
        created.complexity = 2;
        created.playTimeMinutes = 60;
        created.minPlayers = 2;
        created.maxPlayers = 4;
        expect(await levelError(created)).toBe(true);

        expect(await levelError(new UpdateBoardGameDTO())).toBe(false);
        expect(await levelError(updateDto(null))).toBe(true);
    });
});

function createDto(level: unknown): CreateBoardGameDTO {
    const dto = new CreateBoardGameDTO();
    dto.name = 'Catan';
    dto.level = level as number;
    dto.complexity = 2.5;
    dto.playTimeMinutes = 90;
    dto.minPlayers = 3;
    dto.maxPlayers = 4;
    return dto;
}

function updateDto(level: unknown): UpdateBoardGameDTO {
    const dto = new UpdateBoardGameDTO();
    dto.level = level as number;
    return dto;
}

async function levelError(dto: object): Promise<boolean> {
    const errors = await validate(dto);
    return errors.some((error) => error.property === 'level');
}
