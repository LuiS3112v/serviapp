import { IsString, Length } from 'class-validator';

export class Verify2faDto {
  @IsString()
  userId: string;

  @IsString()
  @Length(6, 6)
  code: string;
}