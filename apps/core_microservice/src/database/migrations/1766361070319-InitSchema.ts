import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1766361070319 implements MigrationInterface {
  name = 'InitSchema1766361070319';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "provider" character varying(20) NOT NULL DEFAULT 'local', "provider_id" character varying(255), "last_login_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_ee66de6cdc53993296d1ceb8aa0" UNIQUE ("email"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "profiles_follows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "follower_profile_id" uuid NOT NULL, "followed_profile_id" uuid NOT NULL, "accepted" boolean, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, CONSTRAINT "UQ_32580493d46f0f04500d87560ee" UNIQUE ("follower_profile_id", "followed_profile_id"), CONSTRAINT "PK_2afda6a64450b244f2afc2340f6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "username" character varying(50) NOT NULL, "display_name" character varying(100) NOT NULL, "birthday" date NOT NULL, "bio" text, "avatar_url" character varying(500), "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, "deleted" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_d1ea35db5be7c08520d70dc03f8" UNIQUE ("username"), CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" character varying(20) NOT NULL DEFAULT 'User', "disabled" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" uuid, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_3000dad1da61b29953f07476324" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles_follows" ADD CONSTRAINT "FK_722f4fb48096271c96380c6278c" FOREIGN KEY ("follower_profile_id") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles_follows" ADD CONSTRAINT "FK_90bd341302feb51c5eaa57aab32" FOREIGN KEY ("followed_profile_id") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD CONSTRAINT "FK_9e432b7df0d182f8d292902d1a2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profiles" DROP CONSTRAINT "FK_9e432b7df0d182f8d292902d1a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles_follows" DROP CONSTRAINT "FK_90bd341302feb51c5eaa57aab32"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles_follows" DROP CONSTRAINT "FK_722f4fb48096271c96380c6278c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "FK_3000dad1da61b29953f07476324"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "profiles"`);
    await queryRunner.query(`DROP TABLE "profiles_follows"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
  }
}
