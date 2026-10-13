import { Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthCookieService } from '../../../Auth/AuthCookieService.js';
import { AuthSessionService } from '../../../Auth/AuthSessionService.js';
import { readUserAgent } from '../../../Auth/HttpRequest.js';
import { Public } from '../../../Auth/Public.js';
import { UnauthorizedError } from '../../../Domain/Shared/DomainError.js';

@ApiTags('auth')
@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class RefreshSessionController {
    constructor(
        private readonly sessions: AuthSessionService,
        private readonly cookies: AuthCookieService,
    ) {}

    @Public()
    @Post('refresh')
    @HttpCode(204)
    async execute(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        const rawRefreshToken = this.cookies.readRefresh(request);
        if (!rawRefreshToken) {
            throw new UnauthorizedError('Authentication failed');
        }
        try {
            const session = await this.sessions.refresh(
                rawRefreshToken,
                readUserAgent(request),
            );
            this.cookies.setSession(
                response,
                session.accessToken,
                session.rawRefreshToken,
            );
        } catch (error) {
            this.cookies.clearSession(response);
            throw error;
        }
    }
}
