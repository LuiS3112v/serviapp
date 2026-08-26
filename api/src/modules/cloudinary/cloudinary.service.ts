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
          // SECURITY FIX (KYC URLs publicas): type:'authenticated' torna
          // o recurso privado no Cloudinary — a URL directa deixa de
          // funcionar sem assinatura. O acesso passa a ser feito via
          // generateSignedUrl() com expiracao de 15 minutos, chamado
          // apenas pelo admin atraves de GET /kyc/:id/signed-urls.
          type: 'authenticated',
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
  //
  // SECURITY FIX: adicionados allowed_formats e max_bytes, que já
  // existiam em uploadBuffer mas não aqui — esta função ficava sem
  // nenhum limite de tamanho ou tipo aplicado do lado da Cloudinary,
  // dependendo inteiramente da validação feita antes no service que a
  // chama (que agora também está reforçada em payment-proof.service.ts,
  // mas esta é uma segunda camada independente).
  async uploadRawFile(buffer: Buffer, folder: string, publicId: string): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'raw',
          type: 'upload',
          access_mode: 'public',
          allowed_formats: ['pdf'],
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

  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  // SECURITY FIX (KYC URLs publicas): gera uma URL assinada com
  // expiracao para aceder a recursos do tipo 'authenticated' no
  // Cloudinary. A URL expira ao fim de 15 minutos — tempo suficiente
  // para o admin visualizar o documento sem deixar a URL acessivel
  // indefinidamente. So funciona se o recurso foi carregado com
  // type:'authenticated'; recursos 'upload' publicos nao beneficiam
  // desta assinatura (continuam publicos).
  generateSignedUrl(publicId: string, expiresInSeconds = 900): string {
    const expireAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return cloudinary.url(publicId, {
      type: 'authenticated',
      sign_url: true,
      expires_at: expireAt,
      secure: true,
    });
  }
}