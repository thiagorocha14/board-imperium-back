import { normalizeEmailShape } from '../User/Email.js';

export function isEmailAllowed(
    email: string,
    allowed: readonly string[] | null,
): boolean {
    if (allowed === null || allowed.length === 0) {
        return true;
    }
    return allowed.includes(normalizeEmailShape(email));
}
