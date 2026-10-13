import { Injectable, Logger } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import { createId } from '../Domain/Shared/createId.js';
import { UnauthorizedError } from '../Domain/Shared/DomainError.js';
import { Environment } from '../Environment.js';

@Injectable()
export class AccessTokenService {
    private readonly logger = new Logger(AccessTokenService.name);

    constructor(private readonly environment: Environment) {}

    async sign(userId: string): Promise<string> {
        return new SignJWT({})
            .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
            .setSubject(userId)
            .setIssuer(this.environment.jwtIssuer)
            .setAudience(this.environment.jwtAudience)
            .setIssuedAt()
            .setExpirationTime(`${this.environment.jwtAccessTtlSeconds}s`)
            .setJti(createId())
            .sign(this.key());
    }

    async verify(token: string): Promise<{ sub: string }> {
        try {
            const { payload, protectedHeader } = await jwtVerify(
                token,
                this.key(),
                {
                    algorithms: ['HS256'],
                    issuer: this.environment.jwtIssuer,
                    audience: this.environment.jwtAudience,
                },
            );
            if (protectedHeader.alg !== 'HS256') {
                throw new UnauthorizedError('Authentication failed');
            }
            if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
                throw new UnauthorizedError('Authentication failed');
            }
            return { sub: payload.sub };
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                throw error;
            }
            this.logger.warn(
                `Access token rejected (${error instanceof Error ? error.name : 'Error'})`,
            );
            throw new UnauthorizedError('Authentication failed');
        }
    }

    private key(): Uint8Array {
        return new TextEncoder().encode(this.environment.jwtAccessSecret);
    }
}
