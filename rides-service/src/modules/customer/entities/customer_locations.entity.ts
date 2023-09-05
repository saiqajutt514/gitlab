import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { AbstractEntity } from 'transportation-common';

@Entity('customer_locations')
@Index(['userId'])
export class CustomerLocations extends AbstractEntity {
  @Column({ type: 'bigint' })
  userId: string;

  @Column({ type: 'double' })
  latitude: number;

  @Column({ type: 'double' })
  longitude: number;
}
