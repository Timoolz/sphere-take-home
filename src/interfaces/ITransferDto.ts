import { SupportedCurrency } from "./Currencies";
import { TransferStatus } from "./TransferStatus";

export type TransferRequestDto = {
    narration: string;
    source: string;
    sourceCurrency: SupportedCurrency;
    sourceAmount: number;
    destination: string;
    destinationCurrency: SupportedCurrency;
    reference: string;

  }

  export type TransferDto = {
    id: string;
    narration: string;
    source: string;
    sourceCurrency: SupportedCurrency;
    sourceAmount: number;
    destination: string;
    destinationCurrency: SupportedCurrency;
    destinationAmount: number;
    reference: string;
    status: TransferStatus;
    statusDescription: string | undefined;
    initiatedAt: Date;
    completedAt: Date | undefined;
    idempotenceKey: string | undefined;

  }
