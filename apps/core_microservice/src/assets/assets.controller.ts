import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { AssetsService } from './assets.service';
import {
  editFileName,
  imageAndVideoFileFilter,
} from './utils/file-upload.utils';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData, // Используем интерфейс
} from '../decorators/current-user.decorator';

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get(':filename')
  @ApiOperation({ summary: 'Download uploaded file' })
  async getFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const filePath = join(__dirname, '..', '..', 'uploads', filename);

      // Determine content type based on file extension
      let contentType = 'application/octet-stream';
      if (filename.endsWith('.mp4')) contentType = 'video/mp4';
      else if (filename.endsWith('.webm')) contentType = 'video/webm';
      else if (filename.endsWith('.mov')) contentType = 'video/quicktime';
      else if (filename.endsWith('.avi')) contentType = 'video/x-msvideo';
      else if (filename.endsWith('.mkv')) contentType = 'video/x-matroska';
      else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (filename.endsWith('.png')) contentType = 'image/png';
      else if (filename.endsWith('.gif')) contentType = 'image/gif';
      else if (filename.endsWith('.webp')) contentType = 'image/webp';

      res.set('Content-Type', contentType);
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      const stream = createReadStream(filePath);
      stream.pipe(res);
      stream.on('error', () => {
        res.status(404).json({ error: 'File not found' });
      });
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a file (image or video)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: editFileName,
      }),
      fileFilter: imageAndVideoFileFilter,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserData, // Исправлен тип
  ) {
    return await this.assetsService.createAsset(file, user.id);
  }
}
