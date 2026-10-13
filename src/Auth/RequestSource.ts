export function isAllowedRequestSource(
    origin: string | undefined,
    referer: string | undefined,
    frontUrl: string,
): boolean {
    if (origin) {
        return sameOrigin(origin, frontUrl);
    }
    if (referer) {
        return sameOrigin(referer, frontUrl);
    }
    return false;
}

function sameOrigin(value: string, frontUrl: string): boolean {
    try {
        return new URL(value).origin === new URL(frontUrl).origin;
    } catch {
        return false;
    }
}
