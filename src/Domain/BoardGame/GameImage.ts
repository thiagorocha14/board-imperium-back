import { ValidationError } from '../Shared/DomainError.js';

export const GAME_IMAGE_URL_MAX = 2048;

export class GameImage {
    private constructor(readonly url: string) {}

    static create(value: string): GameImage {
        const normalized = value.trim();
        if (normalized.length === 0 || normalized.length > GAME_IMAGE_URL_MAX) {
            throw new ValidationError(
                `Image URL must be an absolute http or https URL of at most ${GAME_IMAGE_URL_MAX} characters`,
            );
        }
        let url: URL;
        try {
            url = new URL(normalized);
        } catch {
            throw new ValidationError(
                'Image URL must be an absolute http or https URL',
            );
        }
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new ValidationError(
                'Image URL must be an absolute http or https URL',
            );
        }
        if (!url.hostname) {
            throw new ValidationError(
                'Image URL must be an absolute http or https URL',
            );
        }
        if (url.username || url.password) {
            throw new ValidationError('Image URL must not include credentials');
        }
        return new GameImage(normalized);
    }
}
