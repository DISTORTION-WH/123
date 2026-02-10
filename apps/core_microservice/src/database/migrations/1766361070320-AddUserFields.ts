import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserFields1766361070320 implements MigrationInterface {
  name = 'AddUserFields1766361070320';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email" character varying`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "email" = 'temp-' || "id" WHERE "email" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_user_email" UNIQUE ("email")`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" ADD "username" character varying`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "username" = 'user-' || "id" WHERE "username" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_user_username" UNIQUE ("username")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_user_username"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_user_email"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
  }
}
