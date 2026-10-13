import { Inject, Injectable } from '@nestjs/common';
import { ConflictError } from '../../Shared/DomainError.js';
import { USER_REPOSITORY, type IUserRepository } from '../IUserRepository.js';
import type { User } from '../User.js';

@Injectable()
export class CreateUser {
    constructor(
        @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    ) {}

    async execute(user: User): Promise<User> {
        const existing = await this.users.findByEmail(user.email);
        if (existing) {
            throw new ConflictError('Email already exists');
        }
        await this.users.save(user);
        return user;
    }
}
