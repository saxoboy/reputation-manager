import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { CampaignStatus } from '@prisma/client';

export class UpdateCampaignDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;

  @IsInt()
  @Min(1)
  @Max(72)
  @IsOptional()
  scheduledHoursAfter?: number;
}
