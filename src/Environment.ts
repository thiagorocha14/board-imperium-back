export class EnvironmentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EnvironmentError';
    }
}

export type NodeEnvironment = 'development' | 'production' | 'test';

export class Environment {
    readonly jwtIssuer = 'board-imperium';
    readonly jwtAudience = 'board-imperium';

    private constructor(
        readonly nodeEnv: NodeEnvironment,
        readonly port: number,
        readonly frontUrl: string,
        readonly dbHost: string,
        readonly dbPort: number,
        readonly dbName: string,
        readonly dbUser: string,
        readonly dbPassword: string,
        readonly googleClientId: string,
        readonly googleClientSecret: string,
        readonly googleRedirectUri: string,
        readonly jwtAccessSecret: string,
        readonly jwtAccessTtlSeconds: number,
        readonly refreshTokenTtlSeconds: number,
        readonly cookieSecure: boolean,
        readonly authAllowedEmails: readonly string[] | null,
        readonly ludopediaApiBaseUrl: string,
        readonly ludopediaAccessToken: string,
    ) {}

    static load(source: NodeJS.ProcessEnv): Environment {
        const errors: string[] = [];
        const nodeEnv = readNodeEnv(source.NODE_ENV, errors);
        const port = readPort(source.PORT, errors);
        const frontUrl = readOrigin('FRONT_URL', source.FRONT_URL, errors);
        const dbHost = readRequired('DB_HOST', source.DB_HOST, errors);
        const dbPort = readPortValue('DB_PORT', source.DB_PORT, errors);
        const dbName = readRequired('DB_NAME', source.DB_NAME, errors);
        const dbUser = readRequired('DB_USER', source.DB_USER, errors);
        const dbPassword = readRequired(
            'DB_PASSWORD',
            source.DB_PASSWORD,
            errors,
        );
        const googleClientId = readRequired(
            'GOOGLE_CLIENT_ID',
            source.GOOGLE_CLIENT_ID,
            errors,
        );
        const googleClientSecret = readRequired(
            'GOOGLE_CLIENT_SECRET',
            source.GOOGLE_CLIENT_SECRET,
            errors,
        );
        const googleRedirectUri = readAbsoluteUrl(
            'GOOGLE_REDIRECT_URI',
            source.GOOGLE_REDIRECT_URI,
            errors,
        );
        const jwtAccessSecret = readSecret(source.JWT_ACCESS_SECRET, errors);
        const jwtAccessTtlSeconds = readDuration(
            'JWT_ACCESS_TTL',
            source.JWT_ACCESS_TTL,
            60,
            60 * 60,
            errors,
        );
        const refreshTokenTtlSeconds = readDuration(
            'REFRESH_TOKEN_TTL',
            source.REFRESH_TOKEN_TTL,
            60 * 60,
            400 * 24 * 60 * 60,
            errors,
        );
        const cookieSecure = readBoolean(
            'COOKIE_SECURE',
            source.COOKIE_SECURE,
            errors,
        );
        const authAllowedEmails = readEmailList(
            source.AUTH_ALLOWED_EMAILS,
            errors,
        );
        const ludopediaApiBaseUrl = readLudopediaApiBaseUrl(
            source.LUDOPEDIA_API_BASE_URL,
            errors,
        );
        const ludopediaAccessToken = readLudopediaAccessToken(
            source.LUDOPEDIA_ACCESS_TOKEN,
            nodeEnv,
            errors,
        );

        if (nodeEnv === 'production') {
            if (!cookieSecure) {
                errors.push(
                    'COOKIE_SECURE must be true when NODE_ENV is production',
                );
            }
            if (frontUrl && !frontUrl.startsWith('https://')) {
                errors.push(
                    'FRONT_URL must use https when NODE_ENV is production',
                );
            }
            if (
                googleRedirectUri &&
                !googleRedirectUri.startsWith('https://')
            ) {
                errors.push(
                    'GOOGLE_REDIRECT_URI must use https when NODE_ENV is production',
                );
            }
        }

        if (errors.length > 0) {
            throw new EnvironmentError(
                `Invalid environment:\n${errors.map((error) => `- ${error}`).join('\n')}`,
            );
        }

        return new Environment(
            nodeEnv,
            port,
            frontUrl,
            dbHost,
            dbPort,
            dbName,
            dbUser,
            dbPassword,
            googleClientId,
            googleClientSecret,
            googleRedirectUri,
            jwtAccessSecret,
            jwtAccessTtlSeconds,
            refreshTokenTtlSeconds,
            cookieSecure,
            authAllowedEmails,
            ludopediaApiBaseUrl,
            ludopediaAccessToken,
        );
    }
}

function readNodeEnv(
    value: string | undefined,
    errors: string[],
): NodeEnvironment {
    if (value === undefined || value === '') {
        return 'development';
    }
    if (value === 'development' || value === 'production' || value === 'test') {
        return value;
    }
    errors.push('NODE_ENV must be development, production, or test');
    return 'development';
}

function readRequired(
    name: string,
    value: string | undefined,
    errors: string[],
): string {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
        errors.push(`${name} is required`);
        return '';
    }
    return trimmed;
}

function readPort(value: string | undefined, errors: string[]): number {
    if (value === undefined || value === '') {
        return 3000;
    }
    return readPortValue('PORT', value, errors);
}

function readPortValue(
    name: string,
    value: string | undefined,
    errors: string[],
): number {
    if (!value) {
        errors.push(`${name} is required`);
        return 0;
    }
    const port = Number(value);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        errors.push(`${name} must be an integer between 1 and 65535`);
        return 0;
    }
    return port;
}

function readOrigin(
    name: string,
    value: string | undefined,
    errors: string[],
): string {
    const url = parseHttpUrl(name, value, errors);
    if (!url) {
        return '';
    }
    if (url.username || url.password || url.search || url.hash) {
        errors.push(
            `${name} must be an origin without credentials, query, or hash`,
        );
    }
    if (url.pathname !== '/' && url.pathname !== '') {
        errors.push(`${name} must not include a path`);
    }
    return url.origin;
}

function readAbsoluteUrl(
    name: string,
    value: string | undefined,
    errors: string[],
): string {
    const url = parseHttpUrl(name, value, errors);
    if (!url) {
        return '';
    }
    if (url.username || url.password || url.search || url.hash) {
        errors.push(`${name} must not include credentials, query, or hash`);
    }
    return url.toString();
}

function parseHttpUrl(
    name: string,
    value: string | undefined,
    errors: string[],
): URL | null {
    if (!value?.trim()) {
        errors.push(`${name} is required`);
        return null;
    }
    try {
        const url = new URL(value.trim());
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            errors.push(`${name} must use http or https`);
            return null;
        }
        return url;
    } catch {
        errors.push(`${name} must be a valid URL`);
        return null;
    }
}

function readSecret(value: string | undefined, errors: string[]): string {
    const secret = value ?? '';
    if (Buffer.byteLength(secret, 'utf8') < 32) {
        errors.push(
            'JWT_ACCESS_SECRET must be at least 32 bytes. Generate one with: openssl rand -base64 48',
        );
        return '';
    }
    return secret;
}

function readDuration(
    name: string,
    value: string | undefined,
    minSeconds: number,
    maxSeconds: number,
    errors: string[],
): number {
    const match = /^(\d+)(s|m|h|d)$/.exec(value?.trim() ?? '');
    if (!match) {
        errors.push(`${name} must be a duration like 15m, 12h, or 30d`);
        return 0;
    }
    const amount = Number(match[1]);
    const unit = match[2] ?? 's';
    const multipliers: Record<string, number> = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 24 * 60 * 60,
    };
    const seconds = amount * (multipliers[unit] ?? 0);
    if (seconds < minSeconds || seconds > maxSeconds) {
        errors.push(
            `${name} must be between ${minSeconds} and ${maxSeconds} seconds`,
        );
    }
    return seconds;
}

function readBoolean(
    name: string,
    value: string | undefined,
    errors: string[],
): boolean {
    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    errors.push(`${name} must be true or false`);
    return false;
}

const DEFAULT_LUDOPEDIA_API_BASE_URL = 'https://ludopedia.com.br/api/v1';

function readLudopediaApiBaseUrl(
    value: string | undefined,
    errors: string[],
): string {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
        return DEFAULT_LUDOPEDIA_API_BASE_URL;
    }
    try {
        const url = new URL(trimmed);
        if (url.protocol !== 'https:') {
            errors.push('LUDOPEDIA_API_BASE_URL must be an absolute https URL');
            return '';
        }
        if (url.username || url.password || url.search || url.hash) {
            errors.push(
                'LUDOPEDIA_API_BASE_URL must be an absolute https URL without credentials, query, or hash',
            );
            return '';
        }
        return trimmed.replace(/\/$/, '');
    } catch {
        errors.push('LUDOPEDIA_API_BASE_URL must be an absolute https URL');
        return '';
    }
}

function readLudopediaAccessToken(
    value: string | undefined,
    nodeEnv: NodeEnvironment,
    errors: string[],
): string {
    const token = value?.trim() ?? '';
    if (!token && nodeEnv !== 'test') {
        errors.push('LUDOPEDIA_ACCESS_TOKEN is required');
    }
    return token;
}

function readEmailList(
    value: string | undefined,
    errors: string[],
): readonly string[] | null {
    if (value === undefined || value.trim() === '') {
        return null;
    }
    const emails = value
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0);
    if (emails.some((email) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))) {
        errors.push(
            'AUTH_ALLOWED_EMAILS must be a comma-separated list of emails',
        );
        return null;
    }
    return emails;
}
