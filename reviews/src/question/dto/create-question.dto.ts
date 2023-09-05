import { IsNotEmpty, ValidateNested, IsUUID, IsEnum } from 'class-validator';
import { FeedbackQuestionType } from '../question.interface';
export class CreateQuestionDto {

  @IsNotEmpty()
  readonly title: string

  @IsNotEmpty()
  @IsEnum(FeedbackQuestionType)
  questionType: FeedbackQuestionType

  @IsNotEmpty()
  choices: string

}
