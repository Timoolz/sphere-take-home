
import 'reflect-metadata';
import {
  Entity, Column,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  VersionColumn,
  PrimaryGeneratedColumn,
  Index,

} from 'typeorm';
import { SupportedCurrency, TransferStatus } from '../interfaces';
@Index('IDX_revenue_day', ['currency', 'day'])
@Index('UQ_revenue_day', ['currency', 'day'], { unique: true })

@Entity('daily_revenue')
export class DailyRevenue extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
      id!: string;

    @Column({ type: 'varchar', name: 'day', nullable: false })
      day!: string;

    @Column({ type: 'varchar', name: 'currency', nullable: false })
      currency!: SupportedCurrency;

    @Column({ type: 'decimal', precision: 19, scale: 9, name: 'revenue', nullable: false })
      revenue!: number;


    @CreateDateColumn({ type: 'timestamp', name: 'created_at', })
      createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', })
      updatedAt!: Date;

    @VersionColumn({ type: 'int', })
      version!: number;

}
