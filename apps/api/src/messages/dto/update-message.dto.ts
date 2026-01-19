import { PartialType } from '@nestjs/mapped-types';
import { CreateMessageDto } from './create-message.dto';
import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { MessageStatus } from '@prisma/client';

export class UpdateMessageDto extends PartialType(CreateMessageDto) {
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsDateString()
  sentAt?: string;

  @IsOptional()
  @IsDateString()
  deliveredAt?: string;

  @IsOptional()
  @IsDateString()
  repliedAt?: string;
}
