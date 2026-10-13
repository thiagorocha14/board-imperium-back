import { Injectable, Logger } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { jwtVerify, SignJWT } from 'jose';
import { UnauthorizedError } from '../Domain/Shared/DomainError.js';
import { Environment } from '../Environment.js';

const OIDC_AUDIENCE = 'board-imperium-oidc';
const OIDC_TTL_SECONDS = 5 * 60;

export interface OidcTransaction {
    state: string;
    nonce: string;
    codeVerifier: string;
}

@Injectable()
export class AuthCookieService {
    private readonly logger = new Logger(AuthCookieService.name);

    constructor(private readonly environment: Environment) {}

    async setOidc(
        response: Response,
        transaction: OidcTransaction,
    ): Promise<void> {
        const value = await new SignJWT({
            purpose: 'oidc',
            state: transaction.state,
            nonce: transaction.nonce,
            codeVerifier: transaction.codeVerifier,
        })
            .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
            .setIssuer(this.environment.jwtIssuer)
            .setAudience(OIDC_AUDIENCE)
            .setExpirationTime(`${OIDC_TTL_SECONDS}s`)
            .sign(this.key());
        response.cookie(this.oidcName(), value, {
            ...this.baseOptions(),
            path: this.oidcPath(),
            maxAge: OIDC_TTL_SECONDS * 1000,
        });
    }

    async readOidc(request: Request): Promise<OidcTransaction> {
        const value = this.read(request, this.oidcName());
        if (!value) {
            throw new UnauthorizedError('Authentication failed');
        }
        try {
            const { payload } = await jwtVerify(value, this.key(), {
                algorithms: ['HS256'],
                issuer: this.environment.jwtIssuer,
                audience: OIDC_AUDIENCE,
            });
            if (
                payload.purpose !== 'oidc' ||
                typeof payload.state !== 'string' ||
                typeof payload.nonce !== 'string' ||
                typeof payload.codeVerifier !== 'string'
            ) {
                throw new UnauthorizedError('Authentication failed');
            }
            return {
                state: payload.state,
                nonce: payload.nonce,
                codeVerifier: payload.codeVerifier,
            };
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                throw error;
            }
            this.logger.warn(
                `OIDC transaction cookie rejected (${error instanceof Error ? error.name : 'Error'})`,
            );
            throw new UnauthorizedError('Authentication failed');
        }
    }

    setSession(
        response: Response,
        accessToken: string,
        rawRefreshToken: string,
    ): void {
        response.cookie(this.accessName(), accessToken, {
            ...this.baseOptions(),
            path: '/',
            maxAge: this.environment.jwtAccessTtlSeconds * 1000,
        });
        response.cookie(this.refreshName(), rawRefreshToken, {
            ...this.baseOptions(),
            path: '/auth',
            maxAge: this.environment.refreshTokenTtlSeconds * 1000,
        });
    }

    clearSession(response: Response): void {
        response.clearCookie(this.accessName(), {
            ...this.baseOptions(),
            path: '/',
        });
        response.clearCookie(this.refreshName(), {
            ...this.baseOptions(),
            path: '/auth',
        });
    }

    clearOidc(response: Response): void {
        response.clearCookie(this.oidcName(), {
            ...this.baseOptions(),
            path: this.oidcPath(),
        });
    }

    readAccess(request: Request): string | undefined {
        return this.read(request, this.accessName());
    }

    readRefresh(request: Request): string | undefined {
        return this.read(request, this.refreshName());
    }

    hasSessionCookie(request: Request): boolean {
        return (
            this.readAccess(request) !== undefined ||
            this.readRefresh(request) !== undefined
        );
    }

    private accessName(): string {
        return this.environment.cookieSecure
            ? '__Host-access_token'
            : 'access_token';
    }

    private refreshName(): string {
        return 'refresh_token';
    }

    private oidcName(): string {
        return this.environment.cookieSecure
            ? '__Host-oidc_transaction'
            : 'oidc_transaction';
    }

    private oidcPath(): string {
        return this.environment.cookieSecure ? '/' : '/auth';
    }

    private baseOptions(): CookieOptions {
        return {
            httpOnly: true,
            sameSite: 'lax',
            secure: this.environment.cookieSecure,
        };
    }

    private key(): Uint8Array {
        return new TextEncoder().encode(this.environment.jwtAccessSecret);
    }

    private read(request: Request, name: string): string | undefined {
        const cookies = (
            request as Request & { cookies?: Record<string, unknown> }
        ).cookies;
        const value = cookies?.[name];
        return typeof value === 'string' && value.length > 0
            ? value
            : undefined;
    }
}
