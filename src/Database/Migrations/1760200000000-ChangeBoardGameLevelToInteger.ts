import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Level is an integer from 1 to 5. Textual values already stored, including
 * "A definir", have no counterpart on that scale and become 1.
 */
export class ChangeBoardGameLevelToInteger1760200000000 implements MigrationInterface {
    name = 'ChangeBoardGameLevelToInteger1760200000000';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`board_games\` DROP CHECK \`chk_board_games_level\`
    `);
        await queryRunner.query(`
      UPDATE \`board_games\` SET \`level\` = '1'
    `);
        await queryRunner.query(`
      ALTER TABLE \`board_games\`
        MODIFY COLUMN \`level\` INT NOT NULL
    `);
        await queryRunner.query(`
      ALTER TABLE \`board_games\`
        ADD CONSTRAINT \`chk_board_games_level\`
        CHECK (\`level\` BETWEEN 1 AND 5)
    `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE \`board_games\` DROP CHECK \`chk_board_games_level\`
    `);
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
}
