import { AbstractEntity } from 'transportation-common';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'getaliendlinfobyiqama' })
@Index(['iqamaNumber'], { unique: true })
export class getAlienDLInfoByIqama extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint' })
  iqamaNumber: number;

  @Column()
  licssExpiryDateG: string;

  @Column({ type: 'json' })
  data: string;
}
