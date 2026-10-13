import { Module } from '@nestjs/common';
import { MechanicRepositoryModule } from '../../Persistence/Mechanic/MechanicRepositoryModule.js';
import { ListMechanics } from './List/ListMechanics.js';

@Module({
    imports: [MechanicRepositoryModule],
    providers: [ListMechanics],
    exports: [ListMechanics],
})
export class MechanicModule {}
