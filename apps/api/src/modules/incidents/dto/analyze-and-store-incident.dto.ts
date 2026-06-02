import { IsDefined, IsEnum, IsString, MinLength } from 'class-validator';
import { IsOptional } from 'class-validator';
import { IncidentSeverity } from '@prisma/client';

export class AnalyzeAndStoreIncidentDto {
  @IsString()
  @MinLength(5)
  title: string;

  @IsDefined()
  logs: unknown;

  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;
  @IsOptional()
  @IsString()
  trackingId: string;
  @IsString()
  @IsOptional()
  incidentId: string;
}
