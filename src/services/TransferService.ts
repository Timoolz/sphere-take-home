
import SqlDataSource from '../data-source';
import { Currencies, DailyRevenue, Rates, Transfers } from '../entities';
import { StatusResponse, SupportedCurrency, TransferDto, TransferRequestDto, TransferStatus } from '../interfaces';
import { BadRequest, ConflictError, ServerError, UnprocessableRequest } from '../utils/errors/ErrorHandlers';
import { SphereConfig } from '../config';
import { EntityManager, MoreThanOrEqual, Not } from 'typeorm';
import { Logger } from '../utils/Logger';
import processingProviderFactory from './ProcessingProviderFactory';
import { calculateStandardDeviation, todayDateString } from '../utils';


export const transferService = {


  async transfer(idempotenceKey: string, trasnferRequest: TransferRequestDto): Promise<TransferDto> {


    Logger.Info({ trasnferRequest, message: 'About to process Transfer' });

    await this.validateIdempotence(idempotenceKey, trasnferRequest.reference);
    const transfer = await this.initiateTransfer(idempotenceKey, trasnferRequest);
    return Promise.resolve(this.mapTransfer(transfer));

  },


  async initiateTransfer(idempotenceKey: string, trasferRequest: TransferRequestDto): Promise<Transfers> {
    Logger.Info({ trasferRequest, message: 'Intiating Transfer' });

    return await SqlDataSource.transaction(async (manager: EntityManager) => {

      const now = new Date();

      const rateRepository = manager.getRepository(Rates);
      const transferRepository = manager.getRepository(Transfers);
      const currencyRepository = manager.getRepository(Currencies);

      const latestRate = await this.getLatestFXRate(manager, trasferRequest.sourceCurrency, trasferRequest.destinationCurrency);

      const marginPercentage = SphereConfig.marginPercentage[trasferRequest.destinationCurrency];
      if (!latestRate || !marginPercentage) {
        Logger.Error({ trasferRequest, rate: latestRate, margin: marginPercentage, message: 'Rate or Margin not available' });
        throw new UnprocessableRequest({ message: 'System does not have rates for currency pair' });
      }

      let destinationAmount = trasferRequest.sourceAmount * latestRate.rate;
      const marginAmount = destinationAmount * (marginPercentage / 100);
      destinationAmount = destinationAmount - marginAmount;

      const destinationCurrency = await currencyRepository.findOneBy({ name: trasferRequest.destinationCurrency });

      if (!destinationCurrency || destinationCurrency.availableLiquidity < destinationAmount) {
        Logger.Error({ trasferRequest, currency: destinationCurrency, amount: destinationAmount, message: 'Liquidity not available' });
        throw new UnprocessableRequest({ message: 'System cannot Process Destination Currency' });
      }

      // Debit available and mark transfer as initiated

      await currencyRepository.decrement(
        { id: destinationCurrency.id },
        'availableLiquidity',
        destinationAmount
      );

      const transfer = await transferRepository.save({
        narration: trasferRequest.narration,
        source: trasferRequest.source,
        sourceCurrency: trasferRequest.sourceCurrency,
        sourceAmount: trasferRequest.sourceAmount,
        destination: trasferRequest.destination,
        destinationCurrency: destinationCurrency.name,
        destinationAmount,
        appliedRate: latestRate.rate,
        appliedMarginPercentage: marginPercentage,
        appliedMarginAmount: marginAmount,
        reference: trasferRequest.reference,
        status: TransferStatus.Initiated,
        statusDescription: 'Transfer Initiated',
        initiatedAt: now,
        idempotenceId: idempotenceKey,
      } as Transfers);

      this.processTransfer(transfer);
      return transfer;
    });

  },

  async processTransfer(transfer: Transfers): Promise<Transfers> {
    Logger.Info({ transfer, message: 'Processing Transfer' });


    const transferDetails = await SqlDataSource.transaction(async (manager: EntityManager) => {

      const transferRepository = manager.getRepository(Transfers);

      await transferRepository.update({ id: transfer.id }, {
        status: TransferStatus.Processing,
        statusDescription: 'Transfer Processing'
      } as Transfers);

      const transferStatus = await processingProviderFactory.getProvider().process({ currency: transfer.destinationCurrency, amount: transfer.destinationAmount });

      return { transfer, transferStatus };

    });

    this.completeTransfer(transferDetails);
    return transferDetails.transfer;


  },

  async completeTransfer(details: { transfer: Transfers, transferStatus: StatusResponse }) {

    Logger.Info({ details, message: 'Completing Transfer' });

    await SqlDataSource.transaction(async (manager: EntityManager) => {

      const transferRepository = manager.getRepository(Transfers);
      const currencyRepository = manager.getRepository(Currencies);
      const revenueRepository = manager.getRepository(DailyRevenue);

      //If successful, debit legder, add revenue and mark transfer as successful
      if (details.transferStatus.successful) {
        await currencyRepository.decrement(
          { name: details.transfer.destinationCurrency },
          'ledgerLiquidity',
          details.transfer.destinationAmount
        );

        const day = todayDateString;
        const dailyRevenue = await revenueRepository.findOneBy({ day, currency: details.transfer.destinationCurrency });
        if (dailyRevenue) {
          await revenueRepository.increment(
            { day, currency: details.transfer.destinationCurrency },
            'revenue',
            details.transfer.appliedMarginAmount
          );

        } else {
          await revenueRepository.save(
            {
              day,
              currency: details.transfer.destinationCurrency,
              revenue: details.transfer.appliedMarginAmount
            }
          );
        }


        await transferRepository.update({ id: details.transfer.id }, {
          status: TransferStatus.Successful,
          statusDescription: 'Transfer Successful',
          completedAt: new Date(),
        } as Transfers);

      } else {
        //If failed, credit available and mark transfer as failed
        await currencyRepository.increment(
          { name: details.transfer.destinationCurrency },
          'availableLiquidity',
          details.transfer.destinationAmount
        );

        await transferRepository.update({ id: details.transfer.id }, {
          status: TransferStatus.Failed,
          statusDescription: 'Transfer Failed',
          completedAt: new Date(),

        } as Transfers);

      }

      Logger.Info({ details, message: 'Transfer Completed' });

    });

  },

  mapTransfer(transfer: Transfers): TransferDto {

    return {
      id: transfer.id,
      narration: transfer.narration,
      source: transfer.source,
      sourceCurrency: transfer.sourceCurrency,
      sourceAmount: transfer.sourceAmount,
      destination: transfer.destination,
      destinationCurrency: transfer.destinationCurrency,
      destinationAmount: transfer.destinationAmount,
      reference: transfer.reference,
      status: transfer.status,
      statusDescription: transfer.statusDescription,
      initiatedAt: transfer.initiatedAt,
      completedAt: transfer.completedAt,
      idempotenceKey: transfer.idempotenceId,

    };
  },



  async validateIdempotence(idempotenceKey: string, reference: string) {
    const transferRepository = SqlDataSource.getRepository(Transfers);
    const existingTransfer = await transferRepository.existsBy([{ idempotenceId: idempotenceKey }, { reference }]);

    if (existingTransfer) {
      throw new ConflictError({ message: 'Transfer with Reference/Idempotence exists' });
    }

  },


  async rebalanceLiquidityPools(): Promise<void> {
    Logger.Info({ message: 'Starting Liquidity Pool Rebalancing' });

    try {
      await SqlDataSource.transaction(async (manager: EntityManager) => {


        const currencies = await manager.getRepository(Currencies).find();
        const currencyMap = currencies.reduce((acc: Record<SupportedCurrency, Currencies>, cur) => {
          acc[cur.name] = cur;
          return acc;
        }, {} as Record<SupportedCurrency, Currencies>);


        const now = new Date();
        const historicalCutOff = new Date();
        historicalCutOff.setDate(now.getDate() - SphereConfig.historicalCutOff);

        const currencyScores: { [key in SupportedCurrency]?: number } = {};


        for (const currency of currencies) {
          const currencyName = currency.name;

          // Calculate Transaction Volume since last rebalance
          const transactionVolume = await manager.getRepository(Transfers)
            .createQueryBuilder('transfers')
            .select('SUM(transfers.destination_amount)', 'total')
            .where('transfers.destination_currency = :currencyName', { currencyName })
            .andWhere('transfers.completed_at BETWEEN :lastRebalance AND :now', { lastRebalance: currency.lastRebalance, now })
            .andWhere('transfers.status = :status', { status: TransferStatus.Successful }) // Assuming you want successful transfers
            .getRawOne();

          const totalTransactionVolume = transactionVolume?.total || 0;

          // Calculate FX Rate Volatility (Standard Deviation of Rate) since last rebalance
          const fxRates = await manager.getRepository(Rates)
            .createQueryBuilder('rates')
            .where('rates.destination_currency = :currencyName', { currencyName })
            .andWhere('rates.ts BETWEEN :lastRebalance AND :now', { lastRebalance: currency.lastRebalance, now })
            .select(['rates.rate'])
            .getMany();

          const rateVolatility = calculateStandardDeviation(fxRates.map(rate => rate.rate));

          //  Calculate Historical Demand (Total amount transferred) from configured cutoff
          const historicalDemand = await manager.getRepository(Transfers)
            .createQueryBuilder('transfers')
            .where('transfers.destination_currency = :currencyName', { currencyName })
            .andWhere('transfers.initiated_at BETWEEN :historicalCutOff AND :now', { historicalCutOff, now })
            .select('SUM(transfers.destination_amount)', 'totalAmount')
            .getRawOne();

          const demandAmount = parseFloat(historicalDemand?.totalAmount || '0');

          //  Calculate Score
          let score: number = rateVolatility != 0
            ? (((totalTransactionVolume * SphereConfig.transactionVolumeWeight) + (demandAmount * SphereConfig.historicalDemandWeight)) / rateVolatility)
            : (((totalTransactionVolume * SphereConfig.transactionVolumeWeight) + (demandAmount * SphereConfig.historicalDemandWeight)) / 1);

          score = totalTransactionVolume === 0 ? 0 : score;
          currencyScores[currencyName] = score;

          Logger.Info({ currencyName, score, totalTransactionVolume, rateVolatility, demandAmount });
        }

        //  Adjust Liquidity Based on Scores
        await adjustLiquidityBasedOnScores(manager, currencyScores, currencyMap);

      });
    } catch (e: any) {
      Logger.Error({ error: e, message: 'Unexpected error Rebalancing liquididty pool' });
      throw new ServerError({ data: e, message: 'Unexpected error Rebalancing liquididty pool' });
    }

    Logger.Info({ message: 'Liquidity Pool Rebalancing Completed' });
  },


  async getLatestFXRate(manager: EntityManager, sourceCurrency: SupportedCurrency, destinationCurrency: SupportedCurrency): Promise<Rates> {
    const rateRepository = manager.getRepository(Rates);
    const now = new Date();

    const latestRate = await rateRepository.createQueryBuilder('rates')
      .where('rates.source_currency = :sourceCurrency', { sourceCurrency })
      .andWhere('rates.destination_currency = :destinationCurrency', { destinationCurrency })
      .andWhere('rates.ts <= :now', { now })
      .orderBy('rates.ts', 'DESC')
      .getOne();


    if (!latestRate) {
      throw new UnprocessableRequest({ message: 'FX rate not available for currency pair' });
    }

    return latestRate;
  }



};

async function adjustLiquidityBasedOnScores(manager: EntityManager, currencyScores: {
    [key in SupportedCurrency]?: number;
}, currencyMap: Record<SupportedCurrency, Currencies>) {
  const currencyRepository = manager.getRepository(Currencies);

  for (const [currencyName, score] of Object.entries(currencyScores)) {
    if (score === undefined) continue;

    const currency = currencyMap[currencyName as SupportedCurrency];


    if (!currency || score <= 0) continue;

    await currencyRepository.update(
      { id: currency.id },
      {
        availableLiquidity: Number(currency.availableLiquidity) + score,
        ledgerLiquidity: Number(currency.ledgerLiquidity) + score,
        lastRebalance: new Date()
      }
    );

    Logger.Info({
      currency,
      score,
      message: 'Liquidity Adjusted'
    });
  }
}


