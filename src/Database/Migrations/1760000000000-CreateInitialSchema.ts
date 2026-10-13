import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1760000000000 implements MigrationInterface {
    name = 'CreateInitialSchema1760000000000';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` CHAR(36) NOT NULL,
        \`email\` VARCHAR(320) NOT NULL,
        \`display_name\` VARCHAR(120) NOT NULL,
        \`avatar_url\` VARCHAR(2048) NULL,
        \`last_login_at\` DATETIME(6) NULL,
        \`created_at\` DATETIME(6) NOT NULL,
        \`updated_at\` DATETIME(6) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_users_email\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        await queryRunner.query(`
      CREATE TABLE \`user_identities\` (
        \`id\` CHAR(36) NOT NULL,
        \`user_id\` CHAR(36) NOT NULL,
        \`provider\` VARCHAR(32) NOT NULL,
        \`provider_subject\` VARCHAR(255) NOT NULL,
        \`created_at\` DATETIME(6) NOT NULL,
        \`updated_at\` DATETIME(6) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_user_identities_provider_subject\` (\`provider\`, \`provider_subject\`),
        KEY \`idx_user_identities_user_id\` (\`user_id\`),
        CONSTRAINT \`fk_user_identities_user_id\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        await queryRunner.query(`
      CREATE TABLE \`refresh_tokens\` (
        \`id\` CHAR(36) NOT NULL,
        \`user_id\` CHAR(36) NOT NULL,
        \`family_id\` CHAR(36) NOT NULL,
        \`token_hash\` CHAR(64) NOT NULL,
        \`expires_at\` DATETIME(6) NOT NULL,
        \`revoked_at\` DATETIME(6) NULL,
        \`replaced_by_id\` CHAR(36) NULL,
        \`user_agent\` VARCHAR(512) NULL,
        \`created_at\` DATETIME(6) NOT NULL,
        \`updated_at\` DATETIME(6) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_refresh_tokens_token_hash\` (\`token_hash\`),
        KEY \`idx_refresh_tokens_user_id\` (\`user_id\`),
        KEY \`idx_refresh_tokens_family_id\` (\`family_id\`),
        CONSTRAINT \`fk_refresh_tokens_user_id\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        await queryRunner.query(`
      CREATE TABLE \`board_games\` (
        \`id\` CHAR(36) NOT NULL,
        \`user_id\` CHAR(36) NOT NULL,
        \`name\` VARCHAR(150) NOT NULL,
        \`complexity\` DECIMAL(3, 2) NOT NULL,
        \`play_time_minutes\` INT NOT NULL,
        \`min_players\` INT NOT NULL,
        \`max_players\` INT NOT NULL,
        \`created_at\` DATETIME(6) NOT NULL,
        \`updated_at\` DATETIME(6) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_board_games_user_name\` (\`user_id\`, \`name\`),
        CONSTRAINT \`fk_board_games_user_id\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`chk_board_games_complexity\` CHECK (\`complexity\` BETWEEN 1 AND 5),
        CONSTRAINT \`chk_board_games_play_time\` CHECK (\`play_time_minutes\` > 0),
        CONSTRAINT \`chk_board_games_min_players\` CHECK (\`min_players\` >= 1),
        CONSTRAINT \`chk_board_games_max_players\` CHECK (\`max_players\` >= \`min_players\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        await queryRunner.query(`
      CREATE TABLE \`categories\` (
        \`id\` CHAR(36) NOT NULL,
        \`user_id\` CHAR(36) NOT NULL,
        \`name\` VARCHAR(80) NOT NULL,
        \`created_at\` DATETIME(6) NOT NULL,
        \`updated_at\` DATETIME(6) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_categories_user_name\` (\`user_id\`, \`name\`),
        CONSTRAINT \`fk_categories_user_id\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        await queryRunner.query(`
      CREATE TABLE \`mechanics\` (
        \`id\` CHAR(36) NOT NULL,
        \`name\` VARCHAR(80) NOT NULL,
        \`description\` TEXT NULL,
        \`created_at\` DATETIME(6) NOT NULL,
        \`updated_at\` DATETIME(6) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_mechanics_name\` (\`name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        await queryRunner.query(`
      CREATE TABLE \`board_game_categories\` (
        \`board_game_id\` CHAR(36) NOT NULL,
        \`category_id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(6) NOT NULL,
        \`updated_at\` DATETIME(6) NOT NULL,
        PRIMARY KEY (\`board_game_id\`, \`category_id\`),
        KEY \`idx_board_game_categories_category_id\` (\`category_id\`),
        CONSTRAINT \`fk_board_game_categories_board_game_id\`
          FOREIGN KEY (\`board_game_id\`) REFERENCES \`board_games\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_board_game_categories_category_id\`
          FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        await queryRunner.query(`
      CREATE TABLE \`board_game_mechanics\` (
        \`board_game_id\` CHAR(36) NOT NULL,
        \`mechanic_id\` CHAR(36) NOT NULL,
        \`created_at\` DATETIME(6) NOT NULL,
        \`updated_at\` DATETIME(6) NOT NULL,
        PRIMARY KEY (\`board_game_id\`, \`mechanic_id\`),
        KEY \`idx_board_game_mechanics_mechanic_id\` (\`mechanic_id\`),
        CONSTRAINT \`fk_board_game_mechanics_board_game_id\`
          FOREIGN KEY (\`board_game_id\`) REFERENCES \`board_games\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_board_game_mechanics_mechanic_id\`
          FOREIGN KEY (\`mechanic_id\`) REFERENCES \`mechanics\` (\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS `board_game_mechanics`');
        await queryRunner.query('DROP TABLE IF EXISTS `board_game_categories`');
        await queryRunner.query('DROP TABLE IF EXISTS `mechanics`');
        await queryRunner.query('DROP TABLE IF EXISTS `categories`');
        await queryRunner.query('DROP TABLE IF EXISTS `board_games`');
        await queryRunner.query('DROP TABLE IF EXISTS `refresh_tokens`');
        await queryRunner.query('DROP TABLE IF EXISTS `user_identities`');
        await queryRunner.query('DROP TABLE IF EXISTS `users`');
    }
}
