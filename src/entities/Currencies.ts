import 'reflect-metadata';
import {
  Entity, Column,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  VersionColumn,
  PrimaryGeneratedColumn,

} from 'typeorm';
import { SupportedCurrency, TransferStatus } from '../interfaces';

@Entity('currencies')
export class Currencies extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
      id!: string;

    @Column({ type: 'varchar', name: 'name', nullable: false, unique: true })
      name!: SupportedCurrency;

    @Column({ type: 'decimal', precision: 19, scale: 9, name: 'available_liquidity' })
      availableLiquidity!: number;

    @Column({ type: 'decimal', precision: 19, scale: 9, name: 'ledger_liquidity' })
      ledgerLiquidity!: number;

    @Column({ type: 'timestamp', name: 'last_rebalance', nullable: false })
      lastRebalance!: Date;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at', })
      createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', })
      updatedAt!: Date;

    @VersionColumn({ type: 'int', })
      version!: number;

}