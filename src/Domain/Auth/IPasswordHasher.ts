export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface IPasswordHasher {
    hash(password: string): Promise<string>;
    verify(password: string, passwordHash: string): Promise<boolean>;
    needsRehash(passwordHash: string): boolean;
    dummyHash(): Promise<string>;
}
