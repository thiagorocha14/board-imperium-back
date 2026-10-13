import { User } from '../../../Domain/User/User.js';
import type { CreateUserDTO } from '../../../API/User/CreateUserDTO.js';

export function createUserFromDTO(dto: CreateUserDTO): User {
    return User.create({
        email: dto.email,
        displayName: dto.displayName,
        avatarUrl: dto.avatarUrl ?? null,
    });
}
