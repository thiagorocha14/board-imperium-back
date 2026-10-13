import { Module } from '@nestjs/common';
import { PASSWORD_HASHER } from '../Domain/Auth/IPasswordHasher.js';
import { IssueSession } from '../Domain/Auth/IssueSession/IssueSession.js';
import { LoginWithExternalIdentity } from '../Domain/Auth/Login/LoginWithExternalIdentity.js';
import { LoginWithPassword } from '../Domain/Auth/Login/LoginWithPassword.js';
import { RegisterWithPassword } from '../Domain/Auth/Register/RegisterWithPassword.js';
import { RevokeRefreshTokenFamily } from '../Domain/Auth/RevokeRefreshTokenFamily/RevokeRefreshTokenFamily.js';
import { RotateRefreshToken } from '../Domain/Auth/RotateRefreshToken/RotateRefreshToken.js';
import { UserModule } from '../Domain/User/UserModule.js';
import { GoogleOidcModule } from '../Infrastructure/Clients/Google/GoogleOidcModule.js';
import { AuthRepositoryModule } from '../Persistence/Auth/AuthRepositoryModule.js';
import { UserRepositoryModule } from '../Persistence/User/UserRepositoryModule.js';
import { AccessTokenService } from './AccessTokenService.js';
import { Argon2PasswordHasher } from './Argon2PasswordHasher.js';
import { AuthCookieService } from './AuthCookieService.js';
import { AuthSessionService } from './AuthSessionService.js';
import { CredentialOriginGuard } from './CredentialOriginGuard.js';
import { CsrfGuard } from './CsrfGuard.js';
import { JwtAuthGuard } from './JwtAuthGuard.js';

@Module({
    imports: [
        UserModule,
        UserRepositoryModule,
        AuthRepositoryModule,
        GoogleOidcModule,
    ],
    providers: [
        AccessTokenService,
        AuthCookieService,
        AuthSessionService,
        { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
        IssueSession,
        LoginWithExternalIdentity,
        RegisterWithPassword,
        LoginWithPassword,
        RotateRefreshToken,
        RevokeRefreshTokenFamily,
        CredentialOriginGuard,
        JwtAuthGuard,
        CsrfGuard,
    ],
    exports: [
        AccessTokenService,
        AuthCookieService,
        AuthSessionService,
        CredentialOriginGuard,
        JwtAuthGuard,
        CsrfGuard,
        GoogleOidcModule,
    ],
})
export class AuthModule {}
