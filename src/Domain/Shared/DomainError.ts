export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = new.target.name;
    }
}

export class ValidationError extends DomainError {
    constructor(
        message: string,
        readonly details: readonly string[] = [],
    ) {
        super(message);
    }
}

export class NotFoundError extends DomainError {}

export class ConflictError extends DomainError {}

export class UnauthorizedError extends DomainError {}

export class ProviderUnavailableError extends DomainError {
    constructor() {
        super('Catalog provider is unavailable');
    }
}
