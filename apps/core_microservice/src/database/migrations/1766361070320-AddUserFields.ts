import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserFields1766361070320 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');

    if (table && !table.findColumnByName('disabled')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'disabled',
          type: 'boolean',
          default: false,
          isNullable: false,
        }),
      );
    }

    if (table && !table.findColumnByName('role')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'role',
          type: 'varchar',
          default: "'User'",
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');

    if (table && table.findColumnByName('role')) {
      await queryRunner.dropColumn('users', 'role');
    }

    if (table && table.findColumnByName('disabled')) {
      await queryRunner.dropColumn('users', 'disabled');
    }
  }
}
