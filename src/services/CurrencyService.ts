
import SqlDataSource from '../data-source';
import { Currencies } from '../entities';
import { ICurrencySeed, SupportedCurrency } from '../interfaces';

export const currencyService = {


  async seed(currency: ICurrencySeed): Promise<Currencies>{
    const currencyRepository = SqlDataSource.getRepository(Currencies);

    const seededCurrency = await currencyRepository.save({
      name: currency.name,
      availableLiquidity: currency.initialBalance,
      ledgerLiquidity: currency.initialBalance,
      lastRebalance: new Date(),

    } as Currencies);
    return Promise.resolve(seededCurrency);
        
  },

  async findByName(name: SupportedCurrency): Promise<Currencies | null>{
    const currencyRepository = SqlDataSource.getRepository(Currencies);

    const currency = await currencyRepository.findOneBy({name});
    return Promise.resolve(currency);
        
  },


};