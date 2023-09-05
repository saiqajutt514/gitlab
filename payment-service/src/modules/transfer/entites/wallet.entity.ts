import { Column, Entity, Index , ManyToOne, JoinColumn} from "typeorm";
import { AbstractEntity } from "transportation-common";

@Entity('wallet')
@Index(['userId'])
export class WalletEntity extends AbstractEntity {

  @Column({ length: 36})
  userId: string

  @Column({ type: 'float' })
  balance: number;
  
}