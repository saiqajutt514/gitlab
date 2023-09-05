import { AbstractEntityInterface } from "transportation-common"

// Answer type for each master question
export interface ReviewAnswer {
  question_id: string
  question: string

  answer: string
  answer_id?: string
  rating: number
}

export interface Review extends AbstractEntityInterface {

  externalIdFor: number

  externalIdBy: number

  externalType: number

  // TODO: Aggregate average all individual rating of master question
  rating: number

  title: string

  description: string

  answers: string

}