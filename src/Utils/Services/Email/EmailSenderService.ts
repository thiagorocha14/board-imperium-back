import { Logger, Injectable } from '@nestjs/common';

export interface EmailMessage {
    to: string;
    subject: string;
    text: string;
}

export interface EmailSender {
    send(message: EmailMessage): Promise<void>;
}

@Injectable()
export class EmailSenderService implements EmailSender {
    private readonly logger = new Logger(EmailSenderService.name);

    async send(message: EmailMessage): Promise<void> {
        if (process.env.NODE_ENV === 'production') {
            this.logger.warn('Email delivery is not configured');
            return;
        }
        this.logger.log(
            `Development email queued for ${message.to} with subject "${message.subject}"`,
        );
    }
}
