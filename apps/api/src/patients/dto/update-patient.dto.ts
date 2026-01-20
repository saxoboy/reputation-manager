import { PartialType } from '@nestjs/mapped-types';
import { CreatePatientDto } from './create-patient.dto';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @IsOptional()
  @IsDateString()
  optedOutAt?: string;

  @IsOptional()
  @IsDateString()
  dataDeletedAt?: string;
}
