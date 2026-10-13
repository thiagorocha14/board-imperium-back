import { Module } from '@nestjs/common';
import { AuthModule } from '../Auth/AuthModule.js';
import { BoardGameModule } from '../Domain/BoardGame/BoardGameModule.js';
import { CategoryModule } from '../Domain/Category/CategoryModule.js';
import { LudopediaModule } from '../Domain/Ludopedia/LudopediaModule.js';
import { MechanicModule } from '../Domain/Mechanic/MechanicModule.js';
import { UserModule } from '../Domain/User/UserModule.js';
import { CompleteGoogleLoginController } from './Auth/GoogleCallback/CompleteGoogleLoginController.js';
import { StartGoogleLoginController } from './Auth/GoogleLogin/StartGoogleLoginController.js';
import { LoginWithPasswordController } from './Auth/Login/LoginWithPasswordController.js';
import { LogoutController } from './Auth/Logout/LogoutController.js';
import { RefreshSessionController } from './Auth/Refresh/RefreshSessionController.js';
import { RegisterWithPasswordController } from './Auth/Register/RegisterWithPasswordController.js';
import { ListBoardGameCollectionController } from './BoardGame/Collection/ListBoardGameCollectionController.js';
import { CreateBoardGameController } from './BoardGame/Create/CreateBoardGameController.js';
import { DeleteBoardGameController } from './BoardGame/Delete/DeleteBoardGameController.js';
import { DrawBoardGameController } from './BoardGame/Draw/DrawBoardGameController.js';
import { GetBoardGameController } from './BoardGame/Get/GetBoardGameController.js';
import { ListBoardGamesController } from './BoardGame/List/ListBoardGamesController.js';
import { UpdateBoardGameController } from './BoardGame/Update/UpdateBoardGameController.js';
import { CreateCategoryController } from './Category/Create/CreateCategoryController.js';
import { DeleteCategoryController } from './Category/Delete/DeleteCategoryController.js';
import { GetCategoryController } from './Category/Get/GetCategoryController.js';
import { ListCategoriesController } from './Category/List/ListCategoriesController.js';
import { UpdateCategoryController } from './Category/Update/UpdateCategoryController.js';
import { HealthCheckController } from './Health/Check/HealthCheckController.js';
import { GetLudopediaGameController } from './Ludopedia/Get/GetLudopediaGameController.js';
import { ListLudopediaCategoriesController } from './Ludopedia/ListCategories/ListLudopediaCategoriesController.js';
import { ListLudopediaMechanicsController } from './Ludopedia/ListMechanics/ListLudopediaMechanicsController.js';
import { SearchLudopediaGamesController } from './Ludopedia/Search/SearchLudopediaGamesController.js';
import { ListMechanicsController } from './Mechanic/List/ListMechanicsController.js';
import { GetCurrentUserController } from './User/GetCurrent/GetCurrentUserController.js';

@Module({
    imports: [
        AuthModule,
        UserModule,
        BoardGameModule,
        CategoryModule,
        MechanicModule,
        LudopediaModule,
    ],
    controllers: [
        HealthCheckController,
        GetCurrentUserController,
        CreateBoardGameController,
        ListBoardGamesController,
        // Registered before board-games/:id so "collection" and "draw" are not parsed as an id.
        ListBoardGameCollectionController,
        DrawBoardGameController,
        GetBoardGameController,
        UpdateBoardGameController,
        DeleteBoardGameController,
        CreateCategoryController,
        ListCategoriesController,
        GetCategoryController,
        UpdateCategoryController,
        DeleteCategoryController,
        ListMechanicsController,
        SearchLudopediaGamesController,
        GetLudopediaGameController,
        ListLudopediaCategoriesController,
        ListLudopediaMechanicsController,
        StartGoogleLoginController,
        CompleteGoogleLoginController,
        RefreshSessionController,
        RegisterWithPasswordController,
        LoginWithPasswordController,
        LogoutController,
    ],
})
export class APIModule {}
