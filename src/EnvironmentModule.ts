import { Global, Module } from '@nestjs/common';
import { Environment } from './Environment.js';

@Global()
@Module({
    providers: [
        {
            provide: Environment,
            useFactory: (): Environment => Environment.load(process.env),
        },
    ],
    exports: [Environment],
})
export class EnvironmentModule {}
