import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum RatingCategory {
  ROOT_CAUSE_ACCURACY = 'rootCauseAccuracy',
  RECOMMENDATION_QUALITY = 'recommendationQuality',
  OVERALL_USEFULNESS = 'overallUsefulness',
}

export class CreateRatingFeedbackDto {
  @IsEnum(RatingCategory)
  category: RatingCategory;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
