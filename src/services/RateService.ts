
import SqlDataSource from '../data-source';
import { Currencies, Rates } from '../entities';
import { StatusResponse, SupportedCurrency } from '../interfaces';
import RateDto from '../interfaces/IRateDto';
import { BadRequest } from '../utils/errors/ErrorHandlers';

export const rateService = {


  async upsertRate(rateDto: RateDto): Promise<StatusResponse> {
    const rateRepository = SqlDataSource.getRepository(Rates);

    const currencyPair = this.validatePair(rateDto.pair);

    const rate = await rateRepository.save({
      sourceCurrency: currencyPair.source,
      destinationCurrency: currencyPair.destination,
      rate: Number(rateDto.rate),
      ts: rateDto.timestamp,
    } as Rates);

    return Promise.resolve({
      successful: true,
      message: 'Rate Updated successfully'
    });

  },

  validatePair(pair: string): { source: SupportedCurrency, destination: SupportedCurrency } {
    const currencies: string[] = pair.split('/');

    if (!(currencies[0] in SupportedCurrency) || !(currencies[1] in SupportedCurrency)) {
      throw new BadRequest({ message: 'Unsupported currency pair' });
    }

    return {
      source: currencies[0] as SupportedCurrency,
      destination: currencies[1] as SupportedCurrency
    };

  }




};