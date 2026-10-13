import { Module } from '@nestjs/common';
import { CategoryRepositoryModule } from '../../Persistence/Category/CategoryRepositoryModule.js';
import { CreateCategory } from './Create/CreateCategory.js';
import { DeleteCategory } from './Delete/DeleteCategory.js';
import { GetCategory } from './Get/GetCategory.js';
import { ListCategories } from './List/ListCategories.js';
import { UpdateCategory } from './Update/UpdateCategory.js';

@Module({
    imports: [CategoryRepositoryModule],
    providers: [
        CreateCategory,
        UpdateCategory,
        GetCategory,
        ListCategories,
        DeleteCategory,
    ],
    exports: [
        CreateCategory,
        UpdateCategory,
        GetCategory,
        ListCategories,
        DeleteCategory,
    ],
})
export class CategoryModule {}
