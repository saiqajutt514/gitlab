import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from 'transportation-common';

@Entity('iban')
@Index(['iban'])
export class IbanEntity extends AbstractEntity {
  @Column({ length: 100 })
  iban: string;

  @Column({ length: 100, nullable: true })
  bic: string;

  @Column({ length: 100, nullable: true })
  bank: string;

  @Column({ type: 'json', nullable: true })
  data: string;
}
