import { Inject, Injectable } from '@nestjs/common';
import { ConflictError } from '../../Shared/DomainError.js';
import { UNIT_OF_WORK, type IUnitOfWork } from '../../Shared/IUnitOfWork.js';
import { canonicalizeEmail } from '../../User/Email.js';
import { CreateUser } from '../../User/Create/CreateUser.js';
import {
    USER_REPOSITORY,
    type IUserRepository,
} from '../../User/IUserRepository.js';
import { User } from '../../User/User.js';
import type { AuthenticatedSession } from '../AuthenticatedSession.js';
import { isEmailAllowed } from '../EmailPolicy.js';
import { IssueSession } from '../IssueSession/IssueSession.js';
import { PASSWORD_HASHER, type IPasswordHasher } from '../IPasswordHasher.js';
import {
    USER_CREDENTIAL_REPOSITORY,
    type IUserCredentialRepository,
} from '../IUserCredentialRepository.js';
import { assertPasswordPolicy } from '../PasswordPolicy.js';
import { UserCredential } from '../UserCredential.js';

export const REGISTRATION_CONFLICT_MESSAGE = 'Unable to complete registration';

export interface RegisterWithPasswordInput {
    email: string;
    displayName: string;
    password: string;
    userAgent: string | null;
    ttlSeconds: number;
    allowedEmails: readonly string[] | null;
    now?: Date;
}

@Injectable()
export class RegisterWithPassword {
    constructor(
        @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
        @Inject(USER_CREDENTIAL_REPOSITORY)
        private readonly credentials: IUserCredentialRepository,
        @Inject(PASSWORD_HASHER) private readonly passwords: IPasswordHasher,
        private readonly createUser: CreateUser,
        private readonly issueSession: IssueSession,
        @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
    ) {}

    async execute(
        input: RegisterWithPasswordInput,
    ): Promise<AuthenticatedSession> {
        const email = canonicalizeEmail(input.email);
        assertPasswordPolicy(input.password);
        const passwordHash = await this.passwords.hash(input.password);
        const now = input.now ?? new Date();
        const existing = await this.users.findByEmail(email);
        if (!isEmailAllowed(email, input.allowedEmails) || existing) {
            throw new ConflictError(REGISTRATION_CONFLICT_MESSAGE);
        }

        try {
            return await this.unitOfWork.run(async () => {
                const user = await this.createUser.execute(
                    User.create({
                        email,
                        displayName: input.displayName,
                        avatarUrl: null,
                        now,
                    }),
                );
                await this.credentials.save(
                    UserCredential.create({
                        userId: user.id,
                        passwordHash,
                        now,
                    }),
                );
                const issued = await this.issueSession.execute({
                    userId: user.id,
                    userAgent: input.userAgent,
                    ttlSeconds: input.ttlSeconds,
                    now,
                });
                return { user, rawRefreshToken: issued.rawRefreshToken };
            });
        } catch (error) {
            if (error instanceof ConflictError) {
                throw new ConflictError(REGISTRATION_CONFLICT_MESSAGE);
            }
            throw error;
        }
    }
}
