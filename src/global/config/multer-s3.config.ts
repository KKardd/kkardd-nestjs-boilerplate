import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as multerS3 from 'multer-s3';
import * as mime from 'mime-types';
import { Request } from 'express';
import { S3Exception } from '../exception/s3-exception';

export const multerS3Config = (configService: ConfigService): MulterOptions => {
  const s3 = new S3Client({
    region: process.env.AWS_RIGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    },
  });

  return {
    storage: multerS3({
      s3,
      bucket: process.env.S3_BUCKET_NAME,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function (req: Request, file, cb) {
        // TODO) 방식 변경

        const pathParam = req.path.split('/');
        let savedPath: string = '';
        let uploadedName: string = '';
        // pathParam[3] -> stores or menus or banners
        // pathParam[4] -> upload
        // pathParam[5] -> :storeId
        switch (pathParam[3]) {
          case 'stores':
            savedPath = 'stores' + '/ID: ' + pathParam[5];
            uploadedName = 'storeImage';
            break;
          case 'menus':
            savedPath = 'stores' + '/ID: ' + pathParam[5] + '/menus';
            uploadedName = 'menuImage';
            break;
          case 'banners':
            savedPath = 'banners';
            const extensionIdx = file.originalname.lastIndexOf('.'); // 확장자 온점 idx번호
            uploadedName = file.originalname.slice(0, extensionIdx); // 확장자 전까지만 기록
            break;
          default:
            cb(S3Exception.URL_NOT_FOUND);
        }
        const currentDate = new Date();
        const formattedDate = currentDate
          .toISOString()
          .replace(/:/g, '-')
          .slice(0, -5); // 2024-01-08T07-15-59 <- 위와 같은 모양새
        cb(
          null,
          `${savedPath}/${uploadedName} ${formattedDate}.${mime.extension(file.mimetype)}`,
        );
      },
    }),
    limits: {
      fileSize: 1024 * 1024 * 50, // 50 MB
      files: 1,
    },
    fileFilter(req, file, callback) {
      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/heic',
        'image/heif',
      ];

      if (allowedMimeTypes.includes(file.mimetype)) {
        callback(null, true); // 허용
      } else {
        callback(S3Exception.NOT_ALLOWED_EXTENSION, false);
      }
    },
  };
};
