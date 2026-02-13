import { Asset } from '../database/entities/asset.entity';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { AppDataSource } from '../database/data-source';

const execAsync = promisify(exec);

async function generateMissingThumbnails() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const assetRepo = AppDataSource.getRepository(Asset);

    // Find all video assets without thumbnails
    const videoAssets = await assetRepo.find({
      where: [
        { fileType: 'video/mp4', thumbnailPath: null },
        { fileType: 'video/webm', thumbnailPath: null },
        { fileType: 'video/quicktime', thumbnailPath: null },
        { fileType: 'video/x-msvideo', thumbnailPath: null },
        { fileType: 'video/x-matroska', thumbnailPath: null },
      ],
    });

    console.log(`Found ${videoAssets.length} video assets without thumbnails`);

    for (const asset of videoAssets) {
      try {
        const filename = asset.fileName;
        const ext = filename.split('.').pop();
        const thumbnailFilename = `${filename.replace(`.${ext}`, '')}_thumb.jpg`;

        const videoPath = join(__dirname, '..', '..', 'uploads', filename);
        const outputPath = join(__dirname, '..', '..', 'uploads', thumbnailFilename);

        console.log(`Generating thumbnail for: ${filename}`);

        if (!existsSync(videoPath)) {
          console.warn(`Video file not found: ${videoPath}`);
          continue;
        }

        const command = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 "${outputPath}" -y 2>&1`;
        await execAsync(command);

        if (existsSync(outputPath)) {
          asset.thumbnailPath = `/uploads/${thumbnailFilename}`;
          await assetRepo.save(asset);
          console.log(`✓ Thumbnail generated for: ${filename}`);
        } else {
          console.warn(`Thumbnail generation failed for: ${filename}`);
        }
      } catch (error) {
        console.error(`Error processing ${asset.fileName}:`, error);
      }
    }

    console.log('Done!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

generateMissingThumbnails();
