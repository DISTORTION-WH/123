import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../database/entities/asset.entity';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetsRepository: Repository<Asset>,
  ) {}

  private isVideoFile(mimetype: string): boolean {
    return /^video\//.test(mimetype);
  }

  private async generateVideoThumbnail(
    // Private method for generating a preview from a video file
    videoPath: string,
    outputPath: string,
  ): Promise<boolean> {
    try {
      console.log(`Generating thumbnail for: ${videoPath}`);
      console.log(`Output path: ${outputPath}`);
      // Generating ffmpeg command: extract 1 frame at 1 second and save to file
      const command = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 "${outputPath}" -y 2>&1`;
      await execAsync(command);

      const exists = existsSync(outputPath);
      console.log(
        `Thumbnail generation ${exists ? 'succeeded' : 'failed'}: ${outputPath}`,
      );
      return exists;
    } catch (error) {
      console.warn('Failed to generate thumbnail (non-critical):', error);
      return false;
    }
  }

  async createAsset(file: Express.Multer.File, userId: string): Promise<Asset> {
    const filePath = `/uploads/${file.filename}`;
    let thumbnailPath: string | undefined;

    if (this.isVideoFile(file.mimetype)) {
      const ext = file.filename.split('.').pop();
      const thumbnailFilename = `${file.filename.replace(`.${ext}`, '')}_thumb.jpg`;
      const videoPath = join(__dirname, '..', '..', 'uploads', file.filename);
      const outputPath = join(
        __dirname,
        '..',
        '..',
        'uploads',
        thumbnailFilename,
      );

      const success = await this.generateVideoThumbnail(videoPath, outputPath);
      if (success) {
        thumbnailPath = `/uploads/${thumbnailFilename}`;
      }
    }

    const newAsset = this.assetsRepository.create({
      fileName: file.filename,
      filePath,
      fileType: file.mimetype,
      fileSize: file.size,
      thumbnailPath,
      createdBy: userId,
      updatedBy: userId,
    });

    return await this.assetsRepository.save(newAsset);
  }
}
