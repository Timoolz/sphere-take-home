
import currenciesJson from '../../seeds/currencies.json';
import { ICurrencySeed } from '../interfaces';
import { currencyService } from '../services';
import { SeedConfigType } from './SeedConfigType';



const currenciesFromJson = currenciesJson as unknown as SeedConfigType;

export async function seedCurrencyLiquidity() {
  const currencies: ICurrencySeed[] = currenciesFromJson.currencies;

  if (
    !Array.isArray(currencies) 
  ) {
    return;
  }
  for (const currency of currencies) {


    const currencySeeded = await currencyService.findByName(currency.name);

    if (!currencySeeded) {
      await currencyService.seed(currency);
    } 

  }
}
