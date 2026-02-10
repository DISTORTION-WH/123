import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixProfileSchema1766361070321 implements MigrationInterface {
  name = 'FixProfileSchema1766361070321';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profiles" DROP COLUMN "display_name"`,
    );

    await queryRunner.query(
      `ALTER TABLE "profiles" ADD "first_name" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD "last_name" character varying`,
    );

    await queryRunner.query(
      `ALTER TABLE "profiles" ALTER COLUMN "birthday" DROP NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "profiles" ALTER COLUMN "created_by" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "last_name"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "first_name"`);
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD "display_name" character varying(100) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ALTER COLUMN "birthday" SET NOT NULL`,
    );
  }
}
