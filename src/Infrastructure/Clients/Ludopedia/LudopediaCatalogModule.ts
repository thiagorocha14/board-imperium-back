import { Module } from '@nestjs/common';
import { LUDOPEDIA_CATALOG } from '../../../Domain/Ludopedia/ILudopediaCatalog.js';
import { Environment } from '../../../Environment.js';
import { LudopediaHttpCatalog } from './LudopediaHttpCatalog.js';

@Module({
    providers: [
        {
            provide: LUDOPEDIA_CATALOG,
            useFactory: (environment: Environment) =>
                new LudopediaHttpCatalog(environment),
            inject: [Environment],
        },
    ],
    exports: [LUDOPEDIA_CATALOG],
})
export class LudopediaCatalogModule {}
