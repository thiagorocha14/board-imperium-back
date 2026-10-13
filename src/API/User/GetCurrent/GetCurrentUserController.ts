import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../Auth/AuthenticatedUser.js';
import { CurrentUser } from '../../../Auth/CurrentUser.js';
import { GetCurrentUser } from '../../../Domain/User/GetCurrent/GetCurrentUser.js';

@ApiTags('users')
@Controller('users')
export class GetCurrentUserController {
    constructor(private readonly getCurrentUser: GetCurrentUser) {}

    @Get('me')
    @ApiOkResponse({
        schema: {
            example: {
                id: '018f1c3a-7b2a-7c3d-8e4f-9a0b1c2d3e4f',
                email: 'ada@example.com',
                displayName: 'Ada Lovelace',
                avatarUrl: null,
                lastLoginAt: '2026-10-09T12:00:00.000Z',
            },
        },
    })
    async execute(@CurrentUser() currentUser: AuthenticatedUser) {
        const user = await this.getCurrentUser.execute(currentUser.id);
        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        };
    }
}
