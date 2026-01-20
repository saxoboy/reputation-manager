import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { MessageType, MessageChannel } from '@prisma/client';

export class CreateMessageDto {
  @IsString()
  patientId: string;

  @IsEnum(MessageType)
  type: MessageType;

  @IsEnum(MessageChannel)
  channel: MessageChannel;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  templateId?: string;
}

export class SimulateResponseDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
