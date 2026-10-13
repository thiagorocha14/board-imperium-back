import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../Shared/DomainError.js';
import { USER_REPOSITORY, type IUserRepository } from '../IUserRepository.js';
import type { User } from '../User.js';

@Injectable()
export class GetCurrentUser {
    constructor(
        @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    ) {}

    async execute(userId: string): Promise<User> {
        const user = await this.users.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return user;
    }
}
