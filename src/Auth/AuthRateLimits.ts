import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const AUTH_LOGIN_LIMIT = 5;
export const AUTH_LOGIN_TTL_MS = 60_000;
export const AUTH_REGISTER_LIMIT = 5;
export const AUTH_REGISTER_TTL_MS = 60_000;

export function skipThrottleUnlessPath(path: string) {
    return (context: ExecutionContext): boolean => {
        if (context.getType() !== 'http') {
            return true;
        }
        const request = context.switchToHttp().getRequest<Request>();
        return requestPath(request) !== path;
    };
}

function requestPath(request: Request): string {
    if (typeof request.path === 'string' && request.path.length > 0) {
        return request.path;
    }
    const url = request.originalUrl || request.url || '';
    const path = url.split('?')[0];
    return path ?? '';
}
