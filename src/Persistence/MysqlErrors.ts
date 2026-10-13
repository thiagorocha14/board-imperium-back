import { QueryFailedError } from 'typeorm';

export function mysqlErrorCode(error: unknown): string | null {
    if (!(error instanceof QueryFailedError)) {
        return null;
    }
    const driverError: unknown = error.driverError;
    if (
        typeof driverError !== 'object' ||
        driverError === null ||
        !('code' in driverError)
    ) {
        return null;
    }
    const code = driverError.code;
    return typeof code === 'string' ? code : null;
}

export function isDuplicateKey(error: unknown): boolean {
    return mysqlErrorCode(error) === 'ER_DUP_ENTRY';
}

export function isCheckViolation(error: unknown): boolean {
    return mysqlErrorCode(error) === 'ER_CHECK_CONSTRAINT_VIOLATED';
}

export function isForeignKeyViolation(error: unknown): boolean {
    const code = mysqlErrorCode(error);
    return code === 'ER_NO_REFERENCED_ROW_2' || code === 'ER_NO_REFERENCED_ROW';
}
