import {
    type ArgumentsHost,
    Catch,
    type ExceptionFilter,
    HttpException,
    Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
    ConflictError,
    DomainError,
    NotFoundError,
    ProviderUnavailableError,
    UnauthorizedError,
    ValidationError,
} from '../../Domain/Shared/DomainError.js';

interface ErrorBody {
    statusCode: number;
    error: string;
    message: string;
    details?: readonly string[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const response = host.switchToHttp().getResponse<Response>();
        const body = this.toBody(exception);
        if (body.statusCode >= 500) {
            this.logger.error(
                exception instanceof Error ? exception.name : 'UnknownError',
            );
        }
        response.status(body.statusCode).json(body);
    }

    private toBody(exception: unknown): ErrorBody {
        if (exception instanceof ValidationError) {
            const body: ErrorBody = {
                statusCode: 400,
                error: 'ValidationError',
                message: exception.message,
            };
            if (exception.details.length > 0) {
                body.details = exception.details;
            }
            return body;
        }
        if (exception instanceof UnauthorizedError) {
            return {
                statusCode: 401,
                error: 'UnauthorizedError',
                message: 'Authentication failed',
            };
        }
        if (exception instanceof NotFoundError) {
            return {
                statusCode: 404,
                error: 'NotFoundError',
                message: exception.message,
            };
        }
        if (exception instanceof ConflictError) {
            return {
                statusCode: 409,
                error: 'ConflictError',
                message: exception.message,
            };
        }
        if (exception instanceof ProviderUnavailableError) {
            return {
                statusCode: 502,
                error: 'ProviderUnavailableError',
                message: exception.message,
            };
        }
        if (exception instanceof DomainError) {
            return {
                statusCode: 400,
                error: exception.name,
                message: exception.message,
            };
        }
        if (exception instanceof HttpException) {
            const statusCode = exception.getStatus();
            return {
                statusCode,
                error: exception.name,
                message:
                    statusCode === 429
                        ? 'Too many requests'
                        : httpMessage(exception),
            };
        }
        return {
            statusCode: 500,
            error: 'InternalServerError',
            message: 'Internal server error',
        };
    }
}

function httpMessage(exception: HttpException): string {
    const raw: unknown = exception.getResponse();
    if (typeof raw === 'string') {
        return raw;
    }
    if (typeof raw === 'object' && raw !== null && 'message' in raw) {
        const message = raw.message;
        if (typeof message === 'string') {
            return message;
        }
        if (
            Array.isArray(message) &&
            message.every((item) => typeof item === 'string')
        ) {
            return message.join('; ');
        }
    }
    return exception.message;
}
