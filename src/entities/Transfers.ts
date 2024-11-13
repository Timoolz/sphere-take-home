
import 'reflect-metadata';
import {
  Entity, Column,
  UpdateDateColumn,
  CreateDateColumn,
  BaseEntity,
  VersionColumn,
  PrimaryGeneratedColumn,
  Index
} from 'typeorm';
import { SupportedCurrency, TransferStatus } from '../interfaces';

@Entity('transfers')
export class Transfers extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
      id!: string;

    @Column({ type: 'varchar', name: 'narration', nullable: false })
      narration!: string;

    @Column({ type: 'varchar', name: 'reference', nullable: false })
    @Index('UQ_reference', { unique: true })
      reference!: string;

    @Column({ type: 'varchar', name: 'source_currency', nullable: false })
      sourceCurrency!: SupportedCurrency;

    @Column({ type: 'varchar', name: 'destination_currency', nullable: false })
      destinationCurrency!: SupportedCurrency;

    @Column({ type: 'decimal', precision: 19, scale: 9, name: 'source_amount' })
      sourceAmount!: number;

    @Column({ type: 'decimal', precision: 19, scale: 9, name: 'destination_amount' })
      destinationAmount!: number;

    @Column({ type: 'decimal', precision: 19, scale: 9, name: 'applied_rate' })
      appliedRate!: number;

    @Column({ type: 'decimal', precision: 19, scale: 9, name: 'applied_margin_percentage' })
      appliedMarginPercentage!: number;

    @Column({ type: 'decimal', precision: 19, scale: 9, name: 'applied_margin_amount' })
      appliedMarginAmount!: number;

    @Column({ type: 'varchar', name: 'status'})
      status!: TransferStatus;

    @Column({ type: 'timestamp', name: 'initiated_at', nullable: false })
      initiatedAt!: Date;

    @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
      completedAt: Date | undefined;

    @Column({ type: 'varchar', name: 'idempotence_id', nullable: true })
    @Index('UQ_idempotence', { unique: true })
      idempotenceId: string | undefined;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at', })
      createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', })
      updatedAt!: Date;

    @VersionColumn({ type: 'int', })
      version!: number;

}