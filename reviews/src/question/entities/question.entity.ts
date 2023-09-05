import { Entity, Column } from 'typeorm';
import { AbstractEntity } from "transportation-common"

import { FeedbackQuestion, FeedbackQuestionType } from '../question.interface';

@Entity({ name: "feedback_questions" })
export class QuestionEntity extends AbstractEntity implements FeedbackQuestion {

  @Column()
  title: string;

  @Column()
  questionType: FeedbackQuestionType

  @Column()
  choices: string

  @Column()
  isActive: boolean

}
