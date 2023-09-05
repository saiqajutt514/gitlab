import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { AbstractEntity } from 'transportation-common';
import { CustomerEntity } from './customer.entity';

@Entity('customer_app_useage')
@Index(['userId'])
@Index(['clientId'])
export class CustomerAppUsage extends AbstractEntity {
  @Column({ type: 'bigint' })
  userId: number;

  @Column({ length: 34 })
  clientId: string;

  @Column({ type: 'tinyint' })
  status: number;

  @OneToOne(() => CustomerEntity, (customer) => customer.userId, {
    eager: false,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  customer: CustomerEntity;
}
