import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadCsvDto {
  @IsNotEmpty()
  @IsString()
  csvContent: string;

  @IsOptional()
  @IsString()
  delimiter?: string;
}
