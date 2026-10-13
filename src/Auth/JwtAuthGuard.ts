import {
    type CanActivate,
    type ExecutionContext,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { UnauthorizedError } from '../Domain/Shared/DomainError.js';
import { AccessTokenService } from './AccessTokenService.js';
import { AuthCookieService } from './AuthCookieService.js';
import type { AuthenticatedUser } from './AuthenticatedUser.js';
import { IS_PUBLIC } from './Public.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly accessTokens: AccessTokenService,
        private readonly cookies: AuthCookieService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<Request & { user?: AuthenticatedUser }>();
        const token = this.cookies.readAccess(request);
        if (!token) {
            throw new UnauthorizedError('Authentication failed');
        }
        const payload = await this.accessTokens.verify(token);
        request.user = { id: payload.sub };
        return true;
    }
}
