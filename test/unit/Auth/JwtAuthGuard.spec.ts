import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { UnauthorizedError } from '../../../src/Domain/Shared/DomainError.js';
import { AccessTokenService } from '../../../src/Auth/AccessTokenService.js';
import { AuthCookieService } from '../../../src/Auth/AuthCookieService.js';
import { JwtAuthGuard } from '../../../src/Auth/JwtAuthGuard.js';

describe('JwtAuthGuard', () => {
    it('allows a public route without a token', async () => {
        const guard = new JwtAuthGuard(
            reflector(true),
            unusedTokens(),
            cookies(undefined),
        );
        await expect(guard.canActivate(context({}))).resolves.toBe(true);
    });

    it('rejects a protected route without a token', async () => {
        const guard = new JwtAuthGuard(
            reflector(false),
            unusedTokens(),
            cookies(undefined),
        );
        await expect(guard.canActivate(context({}))).rejects.toBeInstanceOf(
            UnauthorizedError,
        );
    });

    it('attaches the subject from a valid access token', async () => {
        const request: { user?: { id: string } } = {};
        const guard = new JwtAuthGuard(
            reflector(false),
            {
                verify: async (token: string) => {
                    if (token !== 'good') {
                        throw new UnauthorizedError('Authentication failed');
                    }
                    return { sub: 'user-1' };
                },
            } as unknown as AccessTokenService,
            cookies('good'),
        );

        await expect(guard.canActivate(context(request))).resolves.toBe(true);
        expect(request.user).toEqual({ id: 'user-1' });
    });
});

function reflector(isPublic: boolean): Reflector {
    return {
        getAllAndOverride: () => isPublic,
    } as unknown as Reflector;
}

function cookies(token: string | undefined): AuthCookieService {
    return {
        readAccess: () => token,
    } as unknown as AuthCookieService;
}

function unusedTokens(): AccessTokenService {
    return {
        verify: async () => {
            throw new Error('verify should not be called');
        },
    } as unknown as AccessTokenService;
}

function context(request: object): ExecutionContext {
    return {
        getHandler: () => function handler() {},
        getClass: () => class HandlerClass {},
        switchToHttp: () => ({
            getRequest: () => request,
        }),
    } as unknown as ExecutionContext;
}
