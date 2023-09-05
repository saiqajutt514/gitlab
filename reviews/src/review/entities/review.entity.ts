import { Column, Entity, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { AbstractEntity } from "transportation-common"

import { Review, ReviewAnswer } from "../review.interface";

@Entity({ name: "trip_feedback" })
@Index(["externalIdFor", "externalType"])
@Index(["externalIdBy", "externalType"])
export class ReviewEntity extends AbstractEntity implements Review {

  @Column({ type: "bigint" })
  externalIdFor: number;

  @Column({ type: "bigint" })
  externalIdBy: number;

  @Column({ type: "tinyint", comment: "who gave the review rider or captain" })
  externalType: number

  @Column({ type: "float", nullable: true })
  rating: number

  @Column({ nullable: true })
  title: string

  @Column({ type: "text", nullable: true })
  description: string

  @Column({ type: "text", nullable: true })
  answers: string

  // TODO: questionaries
  /**
   * Stores the overall rating based on rating for individual question
   */
  // @BeforeInsert()
  // @BeforeUpdate()
  // async aggregateRating(): Promise<void> {
  //   try {
  //     if (!this.rating) {

  //       const answers: ReviewAnswer[] = JSON.parse(this.answers)

  //       // Get sum of the ratings
  //       const rating_sum = answers.reduce(function (sum, answer) {
  //         return sum + answer.rating;
  //       }, 0)

  //       // calculate average rating
  //       const average = rating_sum / answers.length

  //       // Round to nearest half
  //       this.rating = (Math.round(average * 2) / 2) || 0

  //     }
  //   } catch (e) {
  //     this.rating = 0
  //     console.error(e)
  //   }
  // }

}
