import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './AppModule.js';
import { Environment, EnvironmentError } from './Environment.js';

async function bootstrap(): Promise<void> {
    const environment = Environment.load(process.env);
    const app = await NestFactory.create(AppModule, { bodyParser: false });
    const server = app.getHttpAdapter().getInstance() as {
        disable?: (setting: string) => void;
    };
    server.disable?.('x-powered-by');
    app.use(
        helmet({
            contentSecurityPolicy:
                environment.nodeEnv === 'production' ? undefined : false,
        }),
    );
    app.use(cookieParser());
    app.use(json({ limit: '100kb' }));
    app.use(urlencoded({ extended: false, limit: '100kb' }));
    app.enableCors({
        origin: environment.frontUrl,
        credentials: true,
    });

    if (environment.nodeEnv !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('Board Imperium')
            .setDescription('Personal board game collection API')
            .setVersion('1.0')
            .addCookieAuth('access_token')
            .build();
        SwaggerModule.setup(
            'docs',
            app,
            SwaggerModule.createDocument(app, config),
        );
    }

    await app.listen(environment.port, '0.0.0.0');
    Logger.log(`Listening on port ${environment.port}`, 'Bootstrap');
}

void bootstrap().catch((error: unknown) => {
    if (error instanceof EnvironmentError) {
        Logger.error(error.message, 'Bootstrap');
    } else {
        Logger.error('Application failed to start', 'Bootstrap');
    }
    process.exit(1);
});
