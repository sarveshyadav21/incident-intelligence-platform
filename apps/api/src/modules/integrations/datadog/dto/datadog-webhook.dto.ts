import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class DatadogWebhookDto {
  @IsString()
  alert_title!: string;

  @IsString()
  alert_type!: string;

  @IsString()
  event_type!: string;

  @IsString()
  text!: string;

  @IsNumber()
  date_happened!: number;

  @IsNumber()
  id!: number;

  @IsString()
  priority?: string;

  @IsArray()
  tags?: string[];
}
