import type { ExternalIdentity } from './ExternalIdentity.js';

export const EXTERNAL_LOGIN = Symbol('EXTERNAL_LOGIN');

export interface ExternalLoginStart {
    authorizationUrl: string;
    state: string;
    nonce: string;
    codeVerifier: string;
}

export interface ExternalLoginCompletion {
    currentUrl: URL;
    expectedState: string;
    expectedNonce: string;
    codeVerifier: string;
}

export interface IExternalLogin {
    startLogin(): Promise<ExternalLoginStart>;
    completeLogin(input: ExternalLoginCompletion): Promise<ExternalIdentity>;
}
