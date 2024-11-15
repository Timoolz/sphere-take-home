
import { Repository } from 'typeorm';
import SqlDataSource from '../src/data-source';
import { Currencies } from '../src/entities';
import { SupportedCurrency } from '../src/interfaces';
import { currencyService } from '../src/services/CurrencyService';


const mockRepository = jest.fn();


describe('Currency Service', () => {
  let currencyRepository: jest.Mocked<Repository<Currencies>>;

  beforeEach(() => {
    currencyRepository = {
      save: jest.fn(),
      findOneBy: jest.fn(),
    } as unknown as jest.Mocked<Repository<Currencies>>;

    SqlDataSource.getRepository = mockRepository;
    mockRepository.mockReturnValue(currencyRepository)
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should seed a currency with initial balance', async () => {
    const currencySeed = { name: SupportedCurrency.USD, initialBalance: 1000 };
    const savedCurrency = { ...currencySeed, id: 1, lastRebalance: new Date() };

    currencyRepository.save.mockResolvedValue(savedCurrency as unknown as Currencies);

    const result = await currencyService.seed(currencySeed);

    expect(currencyRepository.save).toHaveBeenCalledWith({
      name: SupportedCurrency.USD,
      availableLiquidity: 1000,
      ledgerLiquidity: 1000,
      lastRebalance: expect.any(Date),
    });
    expect(result).toEqual(savedCurrency);
  });

  it('should find a currency by name', async () => {
    const currencyName = SupportedCurrency.EUR;
    const currencyData = { id: 1, name: currencyName, availableLiquidity: 5000 };

    currencyRepository.findOneBy.mockResolvedValue(currencyData as unknown as Currencies);

    const result = await currencyService.findByName(currencyName);

    expect(currencyRepository.findOneBy).toHaveBeenCalledWith({ name: currencyName });
    expect(result).toEqual(currencyData);
  });

  it('should return null if currency not found', async () => {
    currencyRepository.findOneBy.mockResolvedValue(null);

    const result = await currencyService.findByName(SupportedCurrency.GBP);

    expect(result).toBeNull();
  });
});
