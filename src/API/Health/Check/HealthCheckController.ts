import {
    Controller,
    Get,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { Public } from '../../../Auth/Public.js';

@ApiTags('health')
@Controller('health')
export class HealthCheckController {
    private readonly logger = new Logger(HealthCheckController.name);

    constructor(private readonly dataSource: DataSource) {}

    @Public()
    @SkipThrottle()
    @Get()
    @ApiOkResponse({ schema: { example: { status: 'ok' } } })
    async execute(): Promise<{ status: 'ok' }> {
        try {
            await this.dataSource.query('SELECT 1');
        } catch (error) {
            this.logger.error(
                `Health check failed (${error instanceof Error ? error.name : 'Error'})`,
            );
            throw new ServiceUnavailableException('Service unavailable');
        }
        return { status: 'ok' };
    }
}
