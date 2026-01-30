import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { MessageChannel } from '@prisma/client';

export class UpdateWorkspaceChannelSettingsDto {
  @IsEnum(MessageChannel)
  @IsOptional()
  defaultChannel?: MessageChannel;

  @IsBoolean()
  @IsOptional()
  smsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  whatsappEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;
}
