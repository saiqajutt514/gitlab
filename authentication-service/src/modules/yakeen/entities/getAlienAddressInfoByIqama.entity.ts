import { AbstractEntity } from 'transportation-common';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'getalienaddressinfobyiqama' })
@Index(['iqamaNumber'])
export class getAlienAddressInfoByIqama extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint' })
  iqamaNumber: number;

  @Column()
  dateOfBirth: string;

  @Column()
  language: string;

  @Column({ type: 'json' })
  data: string;
}
