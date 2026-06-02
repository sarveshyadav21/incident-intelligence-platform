import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { IncidentSeverity } from '@prisma/client';

export class CreateIncidentDto {
  @IsString()
  @MinLength(5)
  title: string;

  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  summary?: string;
}
