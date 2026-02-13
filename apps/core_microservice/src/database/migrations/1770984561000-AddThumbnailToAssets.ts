import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddThumbnailToAssets1770984561000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'assets',
      new TableColumn({
        name: 'thumbnail_path',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('assets', 'thumbnail_path');
  }
}
