import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserCredentials1760300000000 implements MigrationInterface {
    name = 'CreateUserCredentials1760300000000';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE \`user_credentials\` (
        \`user_id\` CHAR(36) NOT NULL,
        \`password_hash\` VARCHAR(512) NOT NULL,
        \`created_at\` DATETIME(6) NOT NULL,
        \`updated_at\` DATETIME(6) NOT NULL,
        PRIMARY KEY (\`user_id\`),
        CONSTRAINT \`fk_user_credentials_user_id\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`chk_user_credentials_password_hash\`
          CHECK (
            CHAR_LENGTH(\`password_hash\`) BETWEEN 50 AND 512
            AND \`password_hash\` LIKE '$argon2id$v=19$%'
          )
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS `user_credentials`');
    }
}
