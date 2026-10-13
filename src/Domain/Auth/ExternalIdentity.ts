export interface ExternalIdentity {
    provider: string;
    subject: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
}
