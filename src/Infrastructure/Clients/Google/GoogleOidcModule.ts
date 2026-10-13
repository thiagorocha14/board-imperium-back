import { Module } from '@nestjs/common';
import { EXTERNAL_LOGIN } from '../../../Domain/Auth/IExternalLogin.js';
import { GoogleOidcClient } from './GoogleOidcClient.js';

@Module({
    providers: [
        {
            provide: EXTERNAL_LOGIN,
            useClass: GoogleOidcClient,
        },
    ],
    exports: [EXTERNAL_LOGIN],
})
export class GoogleOidcModule {}
