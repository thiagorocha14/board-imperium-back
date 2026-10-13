import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APIModule } from './API/APIModule.js';
import { GlobalExceptionFilter } from './API/Filters/GlobalExceptionFilter.js';
import { validationPipe } from './API/Validation.js';
import {
    AUTH_LOGIN_LIMIT,
    AUTH_LOGIN_TTL_MS,
    AUTH_REGISTER_LIMIT,
    AUTH_REGISTER_TTL_MS,
    skipThrottleUnlessPath,
} from './Auth/AuthRateLimits.js';
import { AuthModule } from './Auth/AuthModule.js';
import { CsrfGuard } from './Auth/CsrfGuard.js';
import { JwtAuthGuard } from './Auth/JwtAuthGuard.js';
import { DatabaseModule } from './Database/DatabaseModule.js';
import { EmailModule } from './Utils/Services/Email/EmailModule.js';
import { EnvironmentModule } from './EnvironmentModule.js';

@Module({
    imports: [
        EnvironmentModule,
        ThrottlerModule.forRoot({
            throttlers: [
                { name: 'default', ttl: 60_000, limit: 100 },
                {
                    name: 'auth-login',
                    ttl: AUTH_LOGIN_TTL_MS,
                    limit: AUTH_LOGIN_LIMIT,
                    skipIf: skipThrottleUnlessPath('/auth/login'),
                },
                {
                    name: 'auth-register',
                    ttl: AUTH_REGISTER_TTL_MS,
                    limit: AUTH_REGISTER_LIMIT,
                    skipIf: skipThrottleUnlessPath('/auth/register'),
                },
            ],
        }),
        DatabaseModule,
        EmailModule,
        AuthModule,
        APIModule,
    ],
    providers: [
        { provide: APP_FILTER, useClass: GlobalExceptionFilter },
        { provide: APP_PIPE, useValue: validationPipe },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: CsrfGuard },
    ],
})
export class AppModule {}
