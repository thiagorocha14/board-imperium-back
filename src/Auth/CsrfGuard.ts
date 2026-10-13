import {
    type CanActivate,
    type ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { Environment } from '../Environment.js';
import { AuthCookieService } from './AuthCookieService.js';
import { isAllowedRequestSource } from './RequestSource.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
    constructor(
        private readonly environment: Environment,
        private readonly cookies: AuthCookieService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        if (context.getType() !== 'http') {
            return true;
        }
        const request = context.switchToHttp().getRequest<Request>();
        if (SAFE_METHODS.has(request.method.toUpperCase())) {
            return true;
        }
        if (!this.cookies.hasSessionCookie(request)) {
            return true;
        }
        if (
            !isAllowedRequestSource(
                request.header('origin'),
                request.header('referer'),
                this.environment.frontUrl,
            )
        ) {
            throw new ForbiddenException('Forbidden');
        }
        return true;
    }
}
