import { Column, Entity, Index } from "typeorm";
import { AbstractEntity } from "transportation-common";

import { SettingCategory, SettingSubCategory } from '../enum/setting.enum';

@Entity({ name: "setting" })
export class SettingEntity extends AbstractEntity {

  @Column({ unique: true })
  name: string;

  @Column()
  value: string;

  @Column({ type: "enum", enum: SettingCategory, default:SettingCategory.OTHER, nullable: true })
  category: number;

  @Column({ type: "enum", enum: SettingSubCategory, default:SettingSubCategory.OTHER, nullable: true })
  subCategory: number;

  @Column({ comment: 'usage of the setting variable' })
  description: string;

}
