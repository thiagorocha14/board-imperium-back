import { Module } from '@nestjs/common';
import { UserRepositoryModule } from '../../Persistence/User/UserRepositoryModule.js';
import { CreateUser } from './Create/CreateUser.js';
import { GetCurrentUser } from './GetCurrent/GetCurrentUser.js';

@Module({
    imports: [UserRepositoryModule],
    providers: [CreateUser, GetCurrentUser],
    exports: [CreateUser, GetCurrentUser],
})
export class UserModule {}
