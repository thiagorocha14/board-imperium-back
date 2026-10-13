import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { RefreshTokenEntity } from '../Persistence/Auth/RefreshTokenEntity.js';
import { UserCredentialEntity } from '../Persistence/Auth/UserCredentialEntity.js';
import { UserIdentityEntity } from '../Persistence/Auth/UserIdentityEntity.js';
import { BoardGameCategoryEntity } from '../Persistence/BoardGame/BoardGameCategoryEntity.js';
import { BoardGameEntity } from '../Persistence/BoardGame/BoardGameEntity.js';
import { BoardGameMechanicEntity } from '../Persistence/BoardGame/BoardGameMechanicEntity.js';
import { CategoryEntity } from '../Persistence/Category/CategoryEntity.js';
import { MechanicEntity } from '../Persistence/Mechanic/MechanicEntity.js';
import { UserEntity } from '../Persistence/User/UserEntity.js';
import { CreateUserCredentials1760300000000 } from './Migrations/1760300000000-CreateUserCredentials.js';
import { AddBoardGameLevelPurchaseAndImage1760100000000 } from './Migrations/1760100000000-AddBoardGameLevelPurchaseAndImage.js';
import { ChangeBoardGameLevelToInteger1760200000000 } from './Migrations/1760200000000-ChangeBoardGameLevelToInteger.js';
import { CreateInitialSchema1760000000000 } from './Migrations/1760000000000-CreateInitialSchema.js';
import { SnakeNamingStrategy } from './SnakeNamingStrategy.js';

function required(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing environment variable ${name}`);
    }
    return value;
}

const dataSource = new DataSource({
    type: 'mysql',
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT ?? 3306),
    username: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
    charset: 'utf8mb4',
    timezone: 'Z',
    namingStrategy: new SnakeNamingStrategy(),
    entities: [
        UserEntity,
        UserIdentityEntity,
        UserCredentialEntity,
        RefreshTokenEntity,
        BoardGameEntity,
        BoardGameCategoryEntity,
        BoardGameMechanicEntity,
        CategoryEntity,
        MechanicEntity,
    ],
    migrations: [
        CreateInitialSchema1760000000000,
        AddBoardGameLevelPurchaseAndImage1760100000000,
        ChangeBoardGameLevelToInteger1760200000000,
        CreateUserCredentials1760300000000,
    ],
    migrationsTransactionMode: 'none',
});

export default dataSource;
