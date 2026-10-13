import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_REPOSITORY } from '../../Domain/User/IUserRepository.js';
import { UserEntity } from './UserEntity.js';
import { UserRepository } from './UserRepository.js';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    providers: [{ provide: USER_REPOSITORY, useClass: UserRepository }],
    exports: [USER_REPOSITORY],
})
export class UserRepositoryModule {}
