import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MECHANIC_REPOSITORY } from '../../Domain/Mechanic/IMechanicRepository.js';
import { MechanicEntity } from './MechanicEntity.js';
import { MechanicRepository } from './MechanicRepository.js';

@Module({
    imports: [TypeOrmModule.forFeature([MechanicEntity])],
    providers: [{ provide: MECHANIC_REPOSITORY, useClass: MechanicRepository }],
    exports: [MECHANIC_REPOSITORY],
})
export class MechanicRepositoryModule {}
