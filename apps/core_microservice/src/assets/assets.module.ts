import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { Asset } from '../database/entities/asset.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset]),
    MulterModule.register({
      dest: './uploads',
    }),
    AuthModule,
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
