import { Module } from '@nestjs/common';
import { CategoryRepositoryModule } from '../../Persistence/Category/CategoryRepositoryModule.js';
import { MechanicRepositoryModule } from '../../Persistence/Mechanic/MechanicRepositoryModule.js';
import { BoardGameRepositoryModule } from '../../Persistence/BoardGame/BoardGameRepositoryModule.js';
import { ListBoardGameCollection } from './Collection/ListBoardGameCollection.js';
import { CreateBoardGame } from './Create/CreateBoardGame.js';
import { DeleteBoardGame } from './Delete/DeleteBoardGame.js';
import { DrawBoardGame } from './Draw/DrawBoardGame.js';
import { GetBoardGame } from './Get/GetBoardGame.js';
import { ListBoardGames } from './List/ListBoardGames.js';
import { UpdateBoardGame } from './Update/UpdateBoardGame.js';

@Module({
    imports: [
        BoardGameRepositoryModule,
        CategoryRepositoryModule,
        MechanicRepositoryModule,
    ],
    providers: [
        CreateBoardGame,
        UpdateBoardGame,
        GetBoardGame,
        ListBoardGames,
        ListBoardGameCollection,
        DeleteBoardGame,
        DrawBoardGame,
    ],
    exports: [
        CreateBoardGame,
        UpdateBoardGame,
        GetBoardGame,
        ListBoardGames,
        ListBoardGameCollection,
        DeleteBoardGame,
        DrawBoardGame,
    ],
})
export class BoardGameModule {}
