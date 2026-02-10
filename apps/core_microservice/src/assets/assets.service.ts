import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../database/entities/asset.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
  ) {}

  async createAsset(file: Express.Multer.File, userId: string): Promise<Asset> {
    const newAsset = this.assetsRepository.create({
      fileName: file.filename,
      filePath: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.assetsRepository.save(newAsset);
  }
}
