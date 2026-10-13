import {
    Body,
    Controller,
    HttpCode,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiOperation,
    ApiTags,
    ApiTooManyRequestsResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthCookieService } from '../../../Auth/AuthCookieService.js';
import {
    AUTH_LOGIN_LIMIT,
    AUTH_LOGIN_TTL_MS,
} from '../../../Auth/AuthRateLimits.js';
import { AuthSessionService } from '../../../Auth/AuthSessionService.js';
import { CredentialOriginGuard } from '../../../Auth/CredentialOriginGuard.js';
import { readUserAgent } from '../../../Auth/HttpRequest.js';
import { LoginLocalDTO } from '../../../Auth/LoginLocalDTO.js';
import { Public } from '../../../Auth/Public.js';

@ApiTags('auth')
@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class LoginWithPasswordController {
    constructor(
        private readonly sessions: AuthSessionService,
        private readonly cookies: AuthCookieService,
    ) {}

    @Public()
    @Post('login')
    @HttpCode(204)
    @SkipThrottle({ default: true })
    @Throttle({
        'auth-login': { limit: AUTH_LOGIN_LIMIT, ttl: AUTH_LOGIN_TTL_MS },
    })
    @UseGuards(CredentialOriginGuard)
    @ApiOperation({ summary: 'Log in with email and password' })
    @ApiBody({ type: LoginLocalDTO })
    @ApiNoContentResponse({
        description:
            'Session cookies were set. Tokens are not returned in the body.',
    })
    @ApiBadRequestResponse({ description: 'The request body is invalid.' })
    @ApiUnauthorizedResponse({ description: 'The credentials are invalid.' })
    @ApiForbiddenResponse({ description: 'The request origin is not allowed.' })
    @ApiTooManyRequestsResponse({ description: 'Too many login attempts.' })
    async execute(
        @Body() body: LoginLocalDTO,
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        const session = await this.sessions.loginLocal({
            email: body.email,
            password: body.password,
            userAgent: readUserAgent(request),
        });
        this.cookies.setSession(
            response,
            session.accessToken,
            session.rawRefreshToken,
        );
    }
}
