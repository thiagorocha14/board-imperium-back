import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Board games created before level existed are backfilled with this sentinel
 * so `level` can be NOT NULL. New registrations must send a real level;
 * they do not use this value.
 */
const EXISTING_BOARD_GAME_LEVEL = 'A definir';

export class AddBoardGameLevelPurchaseAndImage1760100000000 implements MigrationInterface {
    name = 'AddBoardGameLevelPurchaseAndImage1760100000000';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`board_games\`
        ADD COLUMN \`level\` VARCHAR(40) NULL,
        ADD COLUMN \`purchased_at\` DATE NULL,
        ADD COLUMN \`image_url\` VARCHAR(2048) NULL
    `);
        await queryRunner.query(
            'UPDATE `board_games` SET `level` = ? WHERE `level` IS NULL',
            [EXISTING_BOARD_GAME_LEVEL],
        );
        await queryRunner.query(`
      ALTER TABLE \`board_games\`
        MODIFY COLUMN \`level\` VARCHAR(40) NOT NULL
    `);
        await queryRunner.query(`
      ALTER TABLE \`board_games\`
        ADD CONSTRAINT \`chk_board_games_level\`
        CHECK (CHAR_LENGTH(\`level\`) BETWEEN 1 AND 40)
    `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`board_games\` DROP CHECK \`chk_board_games_level\`
    `);
        await queryRunner.query(`
      ALTER TABLE \`board_games\`
        DROP COLUMN \`image_url\`,
        DROP COLUMN \`purchased_at\`,
        DROP COLUMN \`level\`
    `);
    }
}
