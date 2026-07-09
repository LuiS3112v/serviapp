import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

@Injectable()
export class CloudinaryService {
  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    filename: string,
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `serviapp/kyc/${folder}`,
          public_id: filename,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
          max_bytes: 5 * 1024 * 1024,
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(buffer);
    });
  }

  // Upload de ficheiros não-imagem (PDF, etc). resource_type:'raw' é
  // obrigatório na Cloudinary para estes tipos — usar 'image' (o
  // default de uploadBuffer) corrompe o acesso ao ficheiro e a URL
  // deixa de abrir para qualquer utilizador, incluindo quem fez upload.
  async uploadRawFile(buffer: Buffer, folder: string, publicId: string): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'raw',
          type: 'upload',
          access_mode: 'public',
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(buffer);
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}