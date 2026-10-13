import { DefaultNamingStrategy } from 'typeorm';

export class SnakeNamingStrategy extends DefaultNamingStrategy {
    override columnName(
        propertyName: string,
        customName: string,
        embeddedPrefixes: string[],
    ): string {
        const name = customName || propertyName;
        if (embeddedPrefixes.length > 0) {
            return toSnakeCase(`${embeddedPrefixes.join('_')}_${name}`);
        }
        return toSnakeCase(name);
    }

    override joinColumnName(
        relationName: string,
        referencedColumnName: string,
    ): string {
        return toSnakeCase(`${relationName}_${referencedColumnName}`);
    }
}

function toSnakeCase(value: string): string {
    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[-\s]+/g, '_')
        .toLowerCase();
}
