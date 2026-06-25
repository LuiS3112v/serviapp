import { IsArray, IsString } from 'class-validator';

export class UpdateCoverageDto {
  @IsArray()
  @IsString({ each: true })
  provinces: string[];
}