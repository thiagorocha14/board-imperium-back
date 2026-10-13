import {
    Controller,
    Get,
    Inject,
    Logger,
    Query,
    Req,
    Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthCookieService } from '../../../Auth/AuthCookieService.js';
import { AuthSessionService } from '../../../Auth/AuthSessionService.js';
import { callbackUrl, readUserAgent } from '../../../Auth/HttpRequest.js';
import { assertMatchingState } from '../../../Auth/OidcState.js';
import { Public } from '../../../Auth/Public.js';
import {
    EXTERNAL_LOGIN,
    type IExternalLogin,
} from '../../../Domain/Auth/IExternalLogin.js';
import { UnauthorizedError } from '../../../Domain/Shared/DomainError.js';
import { Environment } from '../../../Environment.js';

@ApiTags('auth')
@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class CompleteGoogleLoginController {
    private readonly logger = new Logger(CompleteGoogleLoginController.name);

    constructor(
        private readonly environment: Environment,
        @Inject(EXTERNAL_LOGIN)
        private readonly externalLogin: IExternalLogin,
        private readonly sessions: AuthSessionService,
        private readonly cookies: AuthCookieService,
    ) {}

    @Public()
    @Get('google/callback')
    async execute(
        @Req() request: Request,
        @Res() response: Response,
        @Query('state') state?: string,
        @Query('error') oauthError?: string,
    ): Promise<void> {
        try {
            if (oauthError) {
                throw new UnauthorizedError('Authentication failed');
            }
            const transaction = await this.cookies.readOidc(request);
            assertMatchingState(transaction.state, state ?? '');
            const identity = await this.externalLogin.completeLogin({
                currentUrl: callbackUrl(
                    request,
                    this.environment.googleRedirectUri,
                ),
                expectedState: transaction.state,
                expectedNonce: transaction.nonce,
                codeVerifier: transaction.codeVerifier,
            });
            const session = await this.sessions.login(
                identity,
                readUserAgent(request),
            );
            this.cookies.clearOidc(response);
            this.cookies.setSession(
                response,
                session.accessToken,
                session.rawRefreshToken,
            );
            response.redirect(302, this.environment.frontUrl);
        } catch (error) {
            this.logger.warn(
                `Authentication callback failed (${error instanceof Error ? error.name : 'Error'})`,
            );
            this.cookies.clearOidc(response);
            this.cookies.clearSession(response);
            const target = new URL(this.environment.frontUrl);
            target.searchParams.set('authError', '1');
            response.redirect(302, target.toString());
        }
    }
}
