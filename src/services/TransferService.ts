
import SqlDataSource from '../data-source';
import { Currencies, Rates, Transfers } from '../entities';
import { StatusResponse, SupportedCurrency, TransferDto, TransferRequestDto, TransferStatus } from '../interfaces';
import { BadRequest, ConflictError, UnprocessableRequest } from '../utils/errors/ErrorHandlers';
import { SphereConfig } from '../config';
import { EntityManager } from 'typeorm';
import { Logger } from '../utils/Logger';
import processingProviderFactory from './ProcessingProviderFactory';


export const transferService = {


  async transfer(idempotenceKey: string, trasnferRequest: TransferRequestDto): Promise<TransferDto> {


    Logger.Info({ trasnferRequest, message: 'About tp process Transfer' });

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


      const latestRate = await rateRepository.createQueryBuilder('rates')
        .where('rates.source_currency = :sourceCurrency', { sourceCurrency: trasferRequest.sourceCurrency })
        .andWhere('rates.destination_currency = :destinationCurrency', { destinationCurrency: trasferRequest.destinationCurrency })
        .andWhere('rates.ts <= :now', { now })
        .orderBy('rates.ts', 'DESC')
        .getOne();



      const marginPercentage = SphereConfig.marginPercentage[trasferRequest.destinationCurrency];
      if (!latestRate || !marginPercentage) {
        Logger.Error({ trasferRequest, rate: latestRate, margin: marginPercentage, message: 'Rate or Margin not available' });
        throw new UnprocessableRequest({ message: 'System does not have rates for currency pair' });
      }

      let destinationAmount = trasferRequest.sourceAmount * latestRate.rate;
      const marginAmount = destinationAmount * (marginPercentage/ 100);
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

      await transferRepository.update({id: transfer.id},{
        status: TransferStatus.Processing,
        statusDescription: 'Transfer Processing'
      } as Transfers);

      const transferStatus = await processingProviderFactory.getProvider().process({currency: transfer.destinationCurrency, amount: transfer.destinationAmount});

      return{transfer, transferStatus};
    
    });

    this.completeTransfer(transferDetails);
    return transferDetails.transfer;


  },

  async completeTransfer(details :{transfer: Transfers,transferStatus: StatusResponse  }){

    Logger.Info({ details, message: 'Completing Transfer' });

    await SqlDataSource.transaction(async (manager: EntityManager) => {

      const transferRepository = manager.getRepository(Transfers);
      const currencyRepository = manager.getRepository(Currencies);

      //If successful debit legder and mark transfer as successful
      if( details.transferStatus.successful){
        await currencyRepository.decrement(
          { name: details.transfer.destinationCurrency },
          'ledgerLiquidity',
          details.transfer.destinationAmount
        );

        await transferRepository.update({id: details.transfer.id},{
          status: TransferStatus.Successful,
          statusDescription: 'Transfer Successful',
          completedAt: new Date(),
        } as Transfers);

      }else{
      //If failed credit available and mark transfer as failed
        await currencyRepository.increment(
          { name: details.transfer.destinationCurrency },
          'availableLiquidity',
          details.transfer.destinationAmount
        );

        await transferRepository.update({id: details.transfer.id},{
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

  }


};