import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { UnauthorizedError } from '../Domain/Shared/DomainError.js';
import type { AuthenticatedUser } from './AuthenticatedUser.js';

export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
        const request = context
            .switchToHttp()
            .getRequest<Request & { user?: AuthenticatedUser }>();
        if (!request.user) {
            throw new UnauthorizedError('Authentication failed');
        }
        return request.user;
    },
);
