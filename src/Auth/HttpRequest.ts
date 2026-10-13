import type { Request } from 'express';

const USER_AGENT_MAX = 512;

export function readUserAgent(request: Request): string | null {
    const header = request.header('user-agent');
    if (!header) {
        return null;
    }
    const trimmed = header.trim();
    if (trimmed.length === 0) {
        return null;
    }
    return trimmed.slice(0, USER_AGENT_MAX);
}

export function callbackUrl(request: Request, redirectUri: string): URL {
    const url = new URL(redirectUri);
    const incoming = new URL(request.originalUrl, redirectUri);
    url.search = incoming.search;
    return url;
}
