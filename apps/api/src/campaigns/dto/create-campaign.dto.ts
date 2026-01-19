import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsEmail,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsDateString()
  @IsNotEmpty()
  appointmentTime: string;

  @IsBoolean()
  hasConsent: boolean;
}

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  practiceId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(48)
  @IsOptional()
  scheduledHoursAfter?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePatientDto)
  patients: CreatePatientDto[];
}
