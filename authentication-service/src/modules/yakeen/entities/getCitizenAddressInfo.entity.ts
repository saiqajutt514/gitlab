import { AbstractEntity } from 'transportation-common';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'getcitizenaddressinfo' })
@Index(['userid'])
export class getCitizenAddressInfo extends AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userid: number;

  @Column()
  dateOfBirth: string;

  @Column()
  language: string;

  @Column({ type: 'json' })
  data: string;
}
