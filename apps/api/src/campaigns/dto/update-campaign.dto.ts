import { IsString, IsOptional, IsEnum } from 'class-validator';
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
}
