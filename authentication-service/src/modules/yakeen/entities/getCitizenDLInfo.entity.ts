import { AbstractEntity } from 'transportation-common';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'getcitizendlinfo' })
@Index(['userid'], { unique: true })
export class getCitizenDLInfo extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userid: number;

  @Column()
  licssExpiryDateH: string;

  @Column({ type: 'json' })
  data: string;
}
