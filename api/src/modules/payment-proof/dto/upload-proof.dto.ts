import { IsOptional, IsString } from 'class-validator';

// O ficheiro em si vem via multipart/form-data (Express.Multer.File),
// este DTO cobre só os campos de texto que acompanham o upload.
export class UploadProofDto {
  @IsOptional()
  @IsString()
  note?: string;
}