import { AbstractEntity } from 'transportation-common';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'getcitizeninfo2' })
@Index(['userid'], { unique: true })
export class getCitizenInfo2 extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userid: number;

  @Column()
  dateOfBirth: string;

  @Column({ type: 'json' })
  data: string;
}
