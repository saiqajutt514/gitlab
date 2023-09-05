import { AbstractEntity } from 'transportation-common';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'carinfobysequence' })
@Index(['sequenceNumber'], { unique: true })
export class CarInfoBySequence extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userid: number;

  @Column()
  sequenceNumber: number;

  @Column({ type: 'json' })
  data: string;
}
