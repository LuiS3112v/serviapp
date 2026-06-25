import { IsString } from 'class-validator';

export class UpdateAboutDto {
  @IsString()
  about: string;
}