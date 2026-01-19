import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { MessageChannel } from '@prisma/client';

export class CreatePatientDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsDateString()
  appointmentTime: string;

  @IsOptional()
  @IsString()
  appointmentType?: string;

  @IsBoolean()
  hasConsent: boolean;

  @IsOptional()
  @IsEnum(MessageChannel)
  preferredChannel?: MessageChannel;

  @IsOptional()
  @IsString()
  language?: string;

  @IsString()
  campaignId: string;
}
