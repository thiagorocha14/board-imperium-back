import {
    type CanActivate,
    type ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { Environment } from '../Environment.js';
import { isAllowedRequestSource } from './RequestSource.js';

@Injectable()
export class CredentialOriginGuard implements CanActivate {
    constructor(private readonly environment: Environment) {}

    canActivate(context: ExecutionContext): boolean {
        if (context.getType() !== 'http') {
            return true;
        }
        const request = context.switchToHttp().getRequest<Request>();
        if (
            !isAllowedRequestSource(
                request.header('origin'),
                request.header('referer'),
                this.environment.frontUrl,
            )
        ) {
            throw new ForbiddenException('Forbidden');
        }
        return true;
    }
}
