import { AbstractEntityInterface } from "transportation-common"

export enum FeedbackQuestionType {
  Text = "Text",
  Choice = "Choice"
}

export interface FeedbackQuestion extends AbstractEntityInterface {

  title: string

  questionType: FeedbackQuestionType

  choices: string

  isActive: boolean

}