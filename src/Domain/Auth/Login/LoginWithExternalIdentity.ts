import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../Shared/DomainError.js';
import { UNIT_OF_WORK, type IUnitOfWork } from '../../Shared/IUnitOfWork.js';
import { CreateUser } from '../../User/Create/CreateUser.js';
import {
    USER_REPOSITORY,
    type IUserRepository,
} from '../../User/IUserRepository.js';
import type { User } from '../../User/User.js';
import type { AuthenticatedSession } from '../AuthenticatedSession.js';
import { IssueSession } from '../IssueSession/IssueSession.js';
import {
    USER_IDENTITY_REPOSITORY,
    type IUserIdentityRepository,
} from '../IUserIdentityRepository.js';
import { UserIdentity } from '../UserIdentity.js';

export interface LoginWithExternalIdentityInput {
    provider: string;
    subject: string;
    displayName: string;
    avatarUrl: string | null;
    userAgent: string | null;
    ttlSeconds: number;
    createUser: () => User;
}

@Injectable()
export class LoginWithExternalIdentity {
    constructor(
        @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
        @Inject(USER_IDENTITY_REPOSITORY)
        private readonly identities: IUserIdentityRepository,
        private readonly createUser: CreateUser,
        @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
        private readonly issueSession: IssueSession,
    ) {}

    async execute(
        input: LoginWithExternalIdentityInput,
    ): Promise<AuthenticatedSession> {
        const now = new Date();
        return this.unitOfWork.run(async () => {
            const user = await this.findOrCreate(input, now);
            const issued = await this.issueSession.execute({
                userId: user.id,
                userAgent: input.userAgent,
                ttlSeconds: input.ttlSeconds,
                now,
            });
            return { user, rawRefreshToken: issued.rawRefreshToken };
        });
    }

    private async findOrCreate(
        input: LoginWithExternalIdentityInput,
        now: Date,
    ): Promise<User> {
        const provider = input.provider.trim();
        const subject = input.subject.trim();
        const existingIdentity = await this.identities.findByProviderSubject(
            provider,
            subject,
        );
        if (existingIdentity) {
            const user = await this.users.findById(existingIdentity.userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }
            user.recordLogin({
                displayName: input.displayName,
                avatarUrl: input.avatarUrl,
                now,
            });
            await this.users.save(user);
            return user;
        }

        const user = await this.createUser.execute(input.createUser());
        await this.identities.save(
            UserIdentity.create({
                userId: user.id,
                provider,
                providerSubject: subject,
                now,
            }),
        );
        return user;
    }
}
