import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CATEGORY_REPOSITORY } from '../../Domain/Category/ICategoryRepository.js';
import { CategoryEntity } from './CategoryEntity.js';
import { CategoryRepository } from './CategoryRepository.js';

@Module({
    imports: [TypeOrmModule.forFeature([CategoryEntity])],
    providers: [{ provide: CATEGORY_REPOSITORY, useClass: CategoryRepository }],
    exports: [CATEGORY_REPOSITORY],
})
export class CategoryRepositoryModule {}
