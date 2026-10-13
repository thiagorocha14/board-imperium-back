import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UNIT_OF_WORK } from '../Domain/Shared/IUnitOfWork.js';
import { Environment } from '../Environment.js';
import { TypeOrmUnitOfWork } from '../Persistence/TypeOrmUnitOfWork.js';
import { SnakeNamingStrategy } from './SnakeNamingStrategy.js';

@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            inject: [Environment],
            useFactory: (environment: Environment) => ({
                type: 'mysql' as const,
                host: environment.dbHost,
                port: environment.dbPort,
                username: environment.dbUser,
                password: environment.dbPassword,
                database: environment.dbName,
                charset: 'utf8mb4',
                timezone: 'Z',
                namingStrategy: new SnakeNamingStrategy(),
                autoLoadEntities: true,
            }),
        }),
    ],
    providers: [{ provide: UNIT_OF_WORK, useClass: TypeOrmUnitOfWork }],
    exports: [UNIT_OF_WORK],
})
export class DatabaseModule {}
