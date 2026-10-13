import {
    Injectable,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import {
    authorizationCodeGrant,
    buildAuthorizationUrl,
    calculatePKCECodeChallenge,
    discovery,
    randomNonce,
    randomPKCECodeVerifier,
    randomState,
    type Configuration,
    type IDToken,
} from 'openid-client';
import type { ExternalIdentity } from '../../../Domain/Auth/ExternalIdentity.js';
import type {
    ExternalLoginCompletion,
    ExternalLoginStart,
    IExternalLogin,
} from '../../../Domain/Auth/IExternalLogin.js';
import { UnauthorizedError } from '../../../Domain/Shared/DomainError.js';
import { Environment } from '../../../Environment.js';

const GOOGLE_ISSUER = 'https://accounts.google.com';
const DISPLAY_NAME_MAX = 120;
const AVATAR_URL_MAX = 2048;

@Injectable()
export class GoogleOidcClient implements IExternalLogin {
    private readonly logger = new Logger(GoogleOidcClient.name);
    private configurationTask: Promise<Configuration> | null = null;

    constructor(private readonly environment: Environment) {}

    async startLogin(): Promise<ExternalLoginStart> {
        try {
            const config = await this.configuration();
            const codeVerifier = randomPKCECodeVerifier();
            const codeChallenge =
                await calculatePKCECodeChallenge(codeVerifier);
            const state = randomState();
            const nonce = randomNonce();
            const authorizationUrl = buildAuthorizationUrl(config, {
                redirect_uri: this.environment.googleRedirectUri,
                scope: 'openid email profile',
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                state,
                nonce,
            });
            return {
                authorizationUrl: authorizationUrl.href,
                state,
                nonce,
                codeVerifier,
            };
        } catch (error) {
            this.logger.warn(
                `OIDC login could not start (${error instanceof Error ? error.name : 'Error'})`,
            );
            throw new ServiceUnavailableException(
                'Authentication provider is unavailable',
            );
        }
    }

    async completeLogin(
        input: ExternalLoginCompletion,
    ): Promise<ExternalIdentity> {
        try {
            const config = await this.configuration();
            const tokens = await authorizationCodeGrant(
                config,
                input.currentUrl,
                {
                    expectedState: input.expectedState,
                    expectedNonce: input.expectedNonce,
                    pkceCodeVerifier: input.codeVerifier,
                    idTokenExpected: true,
                },
            );
            return identityFromClaims(tokens.claims());
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                throw error;
            }
            this.logger.warn(
                `OIDC callback rejected (${error instanceof Error ? error.name : 'Error'})`,
            );
            throw new UnauthorizedError('Authentication failed');
        }
    }

    private configuration(): Promise<Configuration> {
        this.configurationTask ??= discovery(
            new URL(GOOGLE_ISSUER),
            this.environment.googleClientId,
            this.environment.googleClientSecret,
        ).catch((error: unknown) => {
            this.configurationTask = null;
            throw error;
        });
        return this.configurationTask;
    }
}

function identityFromClaims(claims: IDToken | undefined): ExternalIdentity {
    if (!claims || claims.email_verified !== true) {
        throw new UnauthorizedError('Authentication failed');
    }
    const email = claims.email;
    const subject = claims.sub;
    if (
        typeof email !== 'string' ||
        subject.trim().length === 0 ||
        subject.length > 255
    ) {
        throw new UnauthorizedError('Authentication failed');
    }
    const name = claims.name;
    const picture = claims.picture;
    const fallback =
        email.split('@')[0]?.slice(0, DISPLAY_NAME_MAX) || 'Player';
    const displayName =
        typeof name === 'string' && name.trim().length > 0
            ? name.trim().slice(0, DISPLAY_NAME_MAX)
            : fallback;
    return {
        provider: 'google',
        subject,
        email,
        displayName,
        avatarUrl: readAvatar(picture),
    };
}

function readAvatar(picture: unknown): string | null {
    if (
        typeof picture !== 'string' ||
        picture.length === 0 ||
        picture.length > AVATAR_URL_MAX
    ) {
        return null;
    }
    try {
        const url = new URL(picture);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') {
            return null;
        }
        return picture;
    } catch {
        return null;
    }
}
