import { Controller, Get, Inject, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthCookieService } from '../../../Auth/AuthCookieService.js';
import { Public } from '../../../Auth/Public.js';
import {
    EXTERNAL_LOGIN,
    type IExternalLogin,
} from '../../../Domain/Auth/IExternalLogin.js';

@ApiTags('auth')
@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class StartGoogleLoginController {
    constructor(
        @Inject(EXTERNAL_LOGIN)
        private readonly externalLogin: IExternalLogin,
        private readonly cookies: AuthCookieService,
    ) {}

    @Public()
    @Get('google/login')
    async execute(@Res() response: Response): Promise<void> {
        const start = await this.externalLogin.startLogin();
        await this.cookies.setOidc(response, start);
        response.redirect(302, start.authorizationUrl);
    }
}
