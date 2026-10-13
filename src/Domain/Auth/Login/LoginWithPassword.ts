import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedError } from '../../Shared/DomainError.js';
import { UNIT_OF_WORK, type IUnitOfWork } from '../../Shared/IUnitOfWork.js';
import { canonicalizeEmail } from '../../User/Email.js';
import {
    USER_REPOSITORY,
    type IUserRepository,
} from '../../User/IUserRepository.js';
import type { AuthenticatedSession } from '../AuthenticatedSession.js';
import { isEmailAllowed } from '../EmailPolicy.js';
import { IssueSession } from '../IssueSession/IssueSession.js';
import { PASSWORD_HASHER, type IPasswordHasher } from '../IPasswordHasher.js';
import {
    USER_CREDENTIAL_REPOSITORY,
    type IUserCredentialRepository,
} from '../IUserCredentialRepository.js';
import { assertPasswordPolicy } from '../PasswordPolicy.js';

const AUTHENTICATION_FAILED = 'Authentication failed';

export interface LoginWithPasswordInput {
    email: string;
    password: string;
    userAgent: string | null;
    ttlSeconds: number;
    allowedEmails: readonly string[] | null;
    now?: Date;
}

@Injectable()
export class LoginWithPassword {
    constructor(
        @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
        @Inject(USER_CREDENTIAL_REPOSITORY)
        private readonly credentials: IUserCredentialRepository,
        @Inject(PASSWORD_HASHER) private readonly passwords: IPasswordHasher,
        private readonly issueSession: IssueSession,
        @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
    ) {}

    async execute(
        input: LoginWithPasswordInput,
    ): Promise<AuthenticatedSession> {
        const email = canonicalizeEmail(input.email);
        assertPasswordPolicy(input.password);
        const now = input.now ?? new Date();
        const user = await this.users.findByEmail(email);
        const credential = user
            ? await this.credentials.findByUserId(user.id)
            : null;
        const passwordHash =
            credential?.passwordHash ?? (await this.passwords.dummyHash());
        const passwordMatches = await this.passwords.verify(
            input.password,
            passwordHash,
        );
        if (
            !user ||
            !credential ||
            !passwordMatches ||
            !isEmailAllowed(email, input.allowedEmails)
        ) {
            throw new UnauthorizedError(AUTHENTICATION_FAILED);
        }

        const nextHash = this.passwords.needsRehash(credential.passwordHash)
            ? await this.passwords.hash(input.password)
            : null;
        return this.unitOfWork.run(async () => {
            user.recordLocalLogin(now);
            await this.users.save(user);
            if (nextHash) {
                credential.replaceHash(nextHash, now);
                await this.credentials.save(credential);
            }
            const issued = await this.issueSession.execute({
                userId: user.id,
                userAgent: input.userAgent,
                ttlSeconds: input.ttlSeconds,
                now,
            });
            return { user, rawRefreshToken: issued.rawRefreshToken };
        });
    }
}
