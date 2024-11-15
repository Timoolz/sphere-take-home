import { rateService } from '../src/services/RateService';
import { BadRequest } from '../src/utils/errors/ErrorHandlers';

import { Repository } from 'typeorm';
import SqlDataSource from '../src/data-source';
import { Currencies, Rates } from '../src/entities';
import RateDto from '../src/interfaces/IRateDto';


const mockRepository = jest.fn();


describe('Rate Service', () => {
  let rateRepository: jest.Mocked<Repository<Rates>>;

  beforeEach(() => {
    rateRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<Rates>>;

    SqlDataSource.getRepository = mockRepository;
    mockRepository.mockReturnValue(rateRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should upsert a new FX rate', async () => {
    const rateDto : RateDto = {
      pair: 'USD/EUR',
      rate: '1.2',
      timestamp: '2024-11-15T11:22:18.123Z' as unknown as Date,
    };

    rateRepository.save.mockResolvedValue({ id: '1', ...rateDto } as unknown as Rates);

    const result = await rateService.upsertRate(rateDto );

    expect(rateRepository.save).toHaveBeenCalledWith({
      sourceCurrency: 'USD',
      destinationCurrency: 'EUR',
      rate: 1.2,
      ts: rateDto.timestamp,
    });
    expect(result.successful).toBe(true);
  });

  it('should throw BadRequest for unsupported currency pair', () => {
    const invalidRateDto = { pair: 'XYZ/ABC', rate: '1.5', timestamp: '2024-11-15T11:22:18.123Z' };

    expect(() => rateService.validatePair(invalidRateDto.pair)).toThrow(BadRequest);
  });
});
