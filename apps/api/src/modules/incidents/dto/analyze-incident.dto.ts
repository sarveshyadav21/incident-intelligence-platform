import { IsDefined } from 'class-validator';

export class AnalyzeIncidentDto {
  @IsDefined()
  logs: unknown;
}
