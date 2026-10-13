import type { User } from '../User/User.js';

export interface AuthenticatedSession {
    user: User;
    rawRefreshToken: string;
}
