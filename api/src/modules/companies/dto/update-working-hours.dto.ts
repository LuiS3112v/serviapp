import { IsArray, ValidateNested, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class DayHoursDto {
  @IsString()
  day: string;

  @IsBoolean()
  open: boolean;

  @IsString()
  from: string;

  @IsString()
  to: string;
}

export class UpdateWorkingHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayHoursDto)
  hours: DayHoursDto[];
}