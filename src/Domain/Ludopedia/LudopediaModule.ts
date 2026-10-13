import { Module } from '@nestjs/common';
import { LudopediaCatalogModule } from '../../Infrastructure/Clients/Ludopedia/LudopediaCatalogModule.js';
import { GetLudopediaGame } from './GetLudopediaGame/GetLudopediaGame.js';
import { ListLudopediaCategories } from './ListLudopediaCategories/ListLudopediaCategories.js';
import { ListLudopediaMechanics } from './ListLudopediaMechanics/ListLudopediaMechanics.js';
import { SearchLudopediaGames } from './SearchLudopediaGames/SearchLudopediaGames.js';

@Module({
    imports: [LudopediaCatalogModule],
    providers: [
        SearchLudopediaGames,
        GetLudopediaGame,
        ListLudopediaCategories,
        ListLudopediaMechanics,
    ],
    exports: [
        SearchLudopediaGames,
        GetLudopediaGame,
        ListLudopediaCategories,
        ListLudopediaMechanics,
    ],
})
export class LudopediaModule {}
