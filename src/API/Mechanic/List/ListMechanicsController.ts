import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListMechanics } from '../../../Domain/Mechanic/List/ListMechanics.js';

@ApiTags('mechanics')
@Controller('mechanics')
export class ListMechanicsController {
    constructor(private readonly listMechanics: ListMechanics) {}

    @Get()
    async execute() {
        const mechanics = await this.listMechanics.execute();
        return mechanics.map((mechanic) => ({
            id: mechanic.id,
            name: mechanic.name,
            description: mechanic.description,
            createdAt: mechanic.createdAt.toISOString(),
            updatedAt: mechanic.updatedAt.toISOString(),
        }));
    }
}
