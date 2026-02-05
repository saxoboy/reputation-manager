import {
  IsBoolean,
  IsEnum,
  IsArray,
  IsOptional,
  IsEmail,
} from 'class-validator';

export enum ReportDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export class UpdateWeeklyReportConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsEnum(ReportDay)
  dayOfWeek?: ReportDay;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  recipients?: string[];
}

export class TestWeeklyReportDto {
  @IsEmail()
  testEmail: string;
}
