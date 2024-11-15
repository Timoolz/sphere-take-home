import { ProviderEnum } from '../interfaces/Providers';

export const appEnv = <string>process.env.NODE_ENV;

export const ErrorConfig = {
  reportStackTrace: appEnv !== 'production',
};



export const SphereConfig = {

  marginPercentage: {
    USD: <number><unknown>process.env.USD_TRANSFER_MARGIN!,
    EUR: <number><unknown>process.env.EUR_TRANSFER_MARGIN!,
    JPY: <number><unknown>process.env.JPY_TRANSFER_MARGIN!,
    AUD: <number><unknown>process.env.AUD_TRANSFER_MARGIN!,  
    GBP: <number><unknown>process.env.GBP_TRANSFER_MARGIN!,

  },

  settlementTime: {
    USD: <number><unknown>process.env.USD_SETTLEMENT_TIME!,
    EUR: <number><unknown>process.env.EUR_SETTLEMENT_TIME!,
    JPY: <number><unknown>process.env.JPY_SETTLEMENT_TIME!,
    AUD: <number><unknown>process.env.AUD_SETTLEMENT_TIME!,
    GBP: <number><unknown>process.env.GBP_SETTLEMENT_TIME!,

  },

  rebalanceFrequency: <unknown>process.env.REBALANCE_FREQUENCY,
  processingProvider: process.env.PROCESSING_PROVIDER!.toUpperCase() as ProviderEnum,

  transactionVolumeWeight : <number><unknown>process.env.TRANSACTION_VOLUME_WEIGHT!,
  historicalDemandWeight :<number><unknown>process.env.HISTORICAL_DEMAND_WEIGHT!,
  historicalCutOff: <number><unknown>process.env.HISTORICAL_CUTOFF_DAYS!,
  rebalanceInterval : <string>process.env.LIQUIDITY_REBALANCE_INTERVAL!, 




};
