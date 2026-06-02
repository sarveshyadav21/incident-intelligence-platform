import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum FeedbackField {
  ROOT_CAUSE = 'rootCause',
  AI_SUMMARY = 'aiSummary',
  REMEDIATION = 'remediation',
  SEVERITY = 'severity',
}

export enum FeedbackActionDto {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  EDIT = 'EDIT',
}

export class CreateFeedbackDto {
  @IsEnum(FeedbackField)
  field: FeedbackField;

  @IsEnum(FeedbackActionDto)
  action: FeedbackActionDto;

  @IsOptional()
  @IsString()
  originalValue?: string;

  @IsOptional()
  @IsString()
  correctedValue?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;
}
