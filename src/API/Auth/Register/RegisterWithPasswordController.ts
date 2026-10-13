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
    ApiConflictResponse,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiOperation,
    ApiTags,
    ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthCookieService } from '../../../Auth/AuthCookieService.js';
import {
    AUTH_REGISTER_LIMIT,
    AUTH_REGISTER_TTL_MS,
} from '../../../Auth/AuthRateLimits.js';
import { AuthSessionService } from '../../../Auth/AuthSessionService.js';
import { CredentialOriginGuard } from '../../../Auth/CredentialOriginGuard.js';
import { readUserAgent } from '../../../Auth/HttpRequest.js';
import { Public } from '../../../Auth/Public.js';
import { RegisterLocalDTO } from '../../../Auth/RegisterLocalDTO.js';

@ApiTags('auth')
@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class RegisterWithPasswordController {
    constructor(
        private readonly sessions: AuthSessionService,
        private readonly cookies: AuthCookieService,
    ) {}

    @Public()
    @Post('register')
    @HttpCode(204)
    @SkipThrottle({ default: true })
    @Throttle({
        'auth-register': {
            limit: AUTH_REGISTER_LIMIT,
            ttl: AUTH_REGISTER_TTL_MS,
        },
    })
    @UseGuards(CredentialOriginGuard)
    @ApiOperation({ summary: 'Register with email and password' })
    @ApiBody({ type: RegisterLocalDTO })
    @ApiNoContentResponse({
        description:
            'Session cookies were set. Tokens are not returned in the body.',
    })
    @ApiBadRequestResponse({ description: 'The request body is invalid.' })
    @ApiConflictResponse({
        description: 'Registration could not be completed.',
    })
    @ApiForbiddenResponse({ description: 'The request origin is not allowed.' })
    @ApiTooManyRequestsResponse({
        description: 'Too many registration attempts.',
    })
    async execute(
        @Body() body: RegisterLocalDTO,
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        const session = await this.sessions.registerLocal({
            email: body.email,
            displayName: body.displayName,
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
