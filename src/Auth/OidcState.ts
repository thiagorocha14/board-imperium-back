import { timingSafeEqual } from 'node:crypto';
import { UnauthorizedError } from '../Domain/Shared/DomainError.js';

export function assertMatchingState(expected: string, received: string): void {
    if (!timingSafeEqualString(expected, received)) {
        throw new UnauthorizedError('Authentication failed');
    }
}

export function timingSafeEqualString(left: string, right: string): boolean {
    const leftBytes = Buffer.from(left);
    const rightBytes = Buffer.from(right);
    if (leftBytes.length !== rightBytes.length) {
        timingSafeEqual(leftBytes, leftBytes);
        return false;
    }
    return timingSafeEqual(leftBytes, rightBytes);
}
