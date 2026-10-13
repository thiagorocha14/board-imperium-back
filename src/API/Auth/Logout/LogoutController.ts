import { Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthCookieService } from '../../../Auth/AuthCookieService.js';
import { AuthSessionService } from '../../../Auth/AuthSessionService.js';
import { Public } from '../../../Auth/Public.js';

@ApiTags('auth')
@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class LogoutController {
    constructor(
        private readonly sessions: AuthSessionService,
        private readonly cookies: AuthCookieService,
    ) {}

    @Public()
    @Post('logout')
    @HttpCode(204)
    async execute(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        try {
            await this.sessions.logout(
                this.cookies.readRefresh(request) ?? null,
            );
        } finally {
            this.cookies.clearSession(response);
        }
    }
}
