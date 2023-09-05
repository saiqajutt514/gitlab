import { AbstractEntity } from 'transportation-common';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'getalieninfobyiqama2' })
@Index(['iqamaNumber'], { unique: true })
export class getAlienInfoByIqama2 extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint' })
  iqamaNumber: number;

  @Column()
  dateOfBirth: string;

  @Column({ type: 'json' })
  data: string;
}
