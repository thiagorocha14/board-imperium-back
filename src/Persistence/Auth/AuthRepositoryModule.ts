import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_CREDENTIAL_REPOSITORY } from '../../Domain/Auth/IUserCredentialRepository.js';
import { REFRESH_TOKEN_REPOSITORY } from '../../Domain/Auth/IRefreshTokenRepository.js';
import { USER_IDENTITY_REPOSITORY } from '../../Domain/Auth/IUserIdentityRepository.js';
import { RefreshTokenEntity } from './RefreshTokenEntity.js';
import { RefreshTokenRepository } from './RefreshTokenRepository.js';
import { UserCredentialEntity } from './UserCredentialEntity.js';
import { UserCredentialRepository } from './UserCredentialRepository.js';
import { UserIdentityEntity } from './UserIdentityEntity.js';
import { UserIdentityRepository } from './UserIdentityRepository.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserIdentityEntity,
            RefreshTokenEntity,
            UserCredentialEntity,
        ]),
    ],
    providers: [
        { provide: USER_IDENTITY_REPOSITORY, useClass: UserIdentityRepository },
        { provide: REFRESH_TOKEN_REPOSITORY, useClass: RefreshTokenRepository },
        {
            provide: USER_CREDENTIAL_REPOSITORY,
            useClass: UserCredentialRepository,
        },
    ],
    exports: [
        USER_IDENTITY_REPOSITORY,
        REFRESH_TOKEN_REPOSITORY,
        USER_CREDENTIAL_REPOSITORY,
    ],
})
export class AuthRepositoryModule {}
