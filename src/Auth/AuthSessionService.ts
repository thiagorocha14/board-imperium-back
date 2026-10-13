import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateUserDTO } from '../API/User/CreateUserDTO.js';
import { isEmailAllowed } from '../Domain/Auth/EmailPolicy.js';
import type { ExternalIdentity } from '../Domain/Auth/ExternalIdentity.js';
import { LoginWithExternalIdentity } from '../Domain/Auth/Login/LoginWithExternalIdentity.js';
import { LoginWithPassword } from '../Domain/Auth/Login/LoginWithPassword.js';
import { RegisterWithPassword } from '../Domain/Auth/Register/RegisterWithPassword.js';
import { RevokeRefreshTokenFamily } from '../Domain/Auth/RevokeRefreshTokenFamily/RevokeRefreshTokenFamily.js';
import { RotateRefreshToken } from '../Domain/Auth/RotateRefreshToken/RotateRefreshToken.js';
import {
    DomainError,
    UnauthorizedError,
} from '../Domain/Shared/DomainError.js';
import { Environment } from '../Environment.js';
import { createUserFromDTO } from '../Utils/Mappers/User/CreateUserDTOToUser.js';
import { AccessTokenService } from './AccessTokenService.js';

export interface SessionTokens {
    accessToken: string;
    rawRefreshToken: string;
}

@Injectable()
export class AuthSessionService {
    private readonly logger = new Logger(AuthSessionService.name);

    constructor(
        private readonly environment: Environment,
        private readonly loginWithExternalIdentity: LoginWithExternalIdentity,
        private readonly registerWithPassword: RegisterWithPassword,
        private readonly loginWithPassword: LoginWithPassword,
        private readonly rotateRefreshToken: RotateRefreshToken,
        private readonly revokeRefreshTokenFamily: RevokeRefreshTokenFamily,
        private readonly accessTokens: AccessTokenService,
    ) {}

    async login(
        identity: ExternalIdentity,
        userAgent: string | null,
    ): Promise<SessionTokens> {
        if (
            !isEmailAllowed(identity.email, this.environment.authAllowedEmails)
        ) {
            throw new UnauthorizedError('Authentication failed');
        }
        const dto = plainToInstance(CreateUserDTO, {
            email: identity.email,
            displayName: identity.displayName,
            avatarUrl: identity.avatarUrl,
        });
        const errors = validateSync(dto, {
            whitelist: true,
            forbidNonWhitelisted: true,
        });
        if (errors.length > 0) {
            throw new UnauthorizedError('Authentication failed');
        }

        try {
            const result = await this.loginWithExternalIdentity.execute({
                provider: identity.provider,
                subject: identity.subject,
                displayName: identity.displayName,
                avatarUrl: identity.avatarUrl,
                userAgent,
                ttlSeconds: this.environment.refreshTokenTtlSeconds,
                createUser: () => createUserFromDTO(dto),
            });
            return this.seal(result.user.id, result.rawRefreshToken);
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                throw error;
            }
            if (error instanceof DomainError) {
                this.logger.warn('Login rejected');
                throw new UnauthorizedError('Authentication failed');
            }
            throw error;
        }
    }

    async registerLocal(input: {
        email: string;
        displayName: string;
        password: string;
        userAgent: string | null;
    }): Promise<SessionTokens> {
        const result = await this.registerWithPassword.execute({
            email: input.email,
            displayName: input.displayName,
            password: input.password,
            userAgent: input.userAgent,
            ttlSeconds: this.environment.refreshTokenTtlSeconds,
            allowedEmails: this.environment.authAllowedEmails,
        });
        return this.seal(result.user.id, result.rawRefreshToken);
    }

    async loginLocal(input: {
        email: string;
        password: string;
        userAgent: string | null;
    }): Promise<SessionTokens> {
        const result = await this.loginWithPassword.execute({
            email: input.email,
            password: input.password,
            userAgent: input.userAgent,
            ttlSeconds: this.environment.refreshTokenTtlSeconds,
            allowedEmails: this.environment.authAllowedEmails,
        });
        return this.seal(result.user.id, result.rawRefreshToken);
    }

    async refresh(
        rawRefreshToken: string,
        userAgent: string | null,
    ): Promise<SessionTokens> {
        const rotated = await this.rotateRefreshToken.execute({
            rawToken: rawRefreshToken,
            userAgent,
            ttlSeconds: this.environment.refreshTokenTtlSeconds,
        });
        return this.seal(rotated.userId, rotated.rawRefreshToken);
    }

    async logout(rawRefreshToken: string | null): Promise<void> {
        await this.revokeRefreshTokenFamily.execute(rawRefreshToken);
    }

    private async seal(
        userId: string,
        rawRefreshToken: string,
    ): Promise<SessionTokens> {
        return {
            accessToken: await this.accessTokens.sign(userId),
            rawRefreshToken,
        };
    }
}
