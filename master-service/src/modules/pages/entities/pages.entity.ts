import { Column, Entity, Generated, Unique } from "typeorm";
import { AbstractEntity } from "transportation-common"

@Entity({ name: "pages" })
export class PagesEntity extends AbstractEntity {

  @Column()
  language: string
  
  @Column()
  title: string
  
  @Column()
  order: number

  @Column('text')
  description: string

  @Column()
  parentId: string
  
  @Column()
  code: string

}