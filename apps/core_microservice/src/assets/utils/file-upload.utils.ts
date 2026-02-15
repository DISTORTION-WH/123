import { HttpException, HttpStatus } from '@nestjs/common';
import { extname } from 'path';

type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

type DiskStorageCallback = (error: Error | null, filename: string) => void;

export const imageAndVideoFileFilter = (
  req: unknown,
  file: Express.Multer.File,
  callback: FileFilterCallback,
) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|mov|avi|mkv)$/)) {
    // Regular expression for checking valid file formats
    return callback(
      new HttpException(
        'Only image and video files are allowed',
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  }
  callback(null, true);
};
// Function to generate a unique file name before saving it to the server
export const editFileName = (
  req: unknown,
  file: Express.Multer.File,
  callback: DiskStorageCallback,
) => {
  const fileExtName = extname(file.originalname);
  const randomName = Array(32)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${randomName}${fileExtName}`);
};
