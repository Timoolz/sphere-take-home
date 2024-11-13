
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

@Entity('rates')
export class Rates extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
      id!: string;

    @Column({ type: 'varchar', name: 'source_currency', nullable: false })
      sourceCurrency!: SupportedCurrency;

    @Column({ type: 'varchar', name: 'destination_currency', nullable: false })
      destinationCurrency!: SupportedCurrency;

    @Column({ type: 'timestamp', name: 'ts', nullable: false })
      ts!: Date;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at', })
      createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', })
      updatedAt!: Date;

    @VersionColumn({ type: 'int', })
      version!: number;

}
