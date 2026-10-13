import { Module } from '@nestjs/common';
import { EmailSenderService } from './EmailSenderService.js';

@Module({
    providers: [EmailSenderService],
    exports: [EmailSenderService],
})
export class EmailModule {}
