import { transferService } from '../src/services/TransferService';
import SqlDataSource from '../src/data-source';
import { Currencies, Transfers, Rates, DailyRevenue } from '../src/entities';
import { SupportedCurrency, TransferRequestDto, TransferStatus } from '../src/interfaces';
import { EntityManager, Repository } from 'typeorm';
import { Logger } from '../src/utils/Logger';
import  processingProviderFactory  from '../src/services/ProcessingProviderFactory';
import { UnprocessableRequest } from '../src/utils/errors/ErrorHandlers';

jest.mock('../src/data-source');
jest.mock('../src/services/ProcessingProviderFactory');
jest.mock('../src/utils/Logger');

describe('Transfer Service', () => {
  
  let manager: jest.Mocked<EntityManager>;


  beforeEach(() => {
    manager = {
      getRepository: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

  
    (SqlDataSource.transaction as jest.Mock).mockImplementation((cb) => cb(manager));
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should process a transfer successfully', async () => {
    const transferRequest: TransferRequestDto = {
      source: 'Alice',
      destination: 'Bob',
      sourceCurrency: 'USD' as SupportedCurrency,
      sourceAmount: 100,
      destinationCurrency: 'EUR' as SupportedCurrency,
      reference: 'txn123',
      narration: 'Payment for services',
    };
  
    const mockRate = { sourceCurrency: 'USD', destinationCurrency: 'EUR', rate: 1.1 };
    const mockCurrency = { id: 1, name: 'EUR', availableLiquidity: 5000 };
  
    const transferRepo = {
      save: jest.fn().mockResolvedValue({ id: 1, ...transferRequest, status: TransferStatus.Initiated }),
      update: jest.fn(),
      existsBy: jest.fn().mockResolvedValue(false),
    } as unknown as Repository<Transfers>;
  
    const rateRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockRate),
      }),
      getOne: jest.fn().mockResolvedValue(mockRate),
    } as unknown as Repository<Rates>;
  
    const currencyRepo = {
      findOneBy: jest.fn().mockResolvedValue(mockCurrency),
      decrement: jest.fn(),
    } as unknown as Repository<Currencies>;

    const dailyRevenueRepo = {
      findOneBy: jest.fn().mockResolvedValue(mockCurrency),
      increment: jest.fn(),
    } as unknown as Repository<DailyRevenue>;
  
    manager.getRepository.mockImplementation((entity) => {
      if (entity === Transfers) {
        return transferRepo;
      } else if (entity === Rates) {
        return rateRepo;
      } else if (entity === Currencies) {
        return currencyRepo;
      } else if (entity === DailyRevenue) {
        return dailyRevenueRepo;
      }
      throw new Error(`Unexpected entity: ${entity}`);
    });
  
    const processingProviderMock = { process: jest.fn().mockResolvedValue({ successful: true }) };
    (processingProviderFactory.getProvider as jest.Mock).mockReturnValue(processingProviderMock);
  
    const result = await transferService.transfer('idempotency-key', transferRequest);
  
    expect(currencyRepo.decrement).toHaveBeenCalled();
    expect(processingProviderMock.process).toHaveBeenCalled();
    expect(transferRepo.save).toHaveBeenCalled();
    expect(result.status).toBe(TransferStatus.Initiated);
  });
  
  it('should throw an error if FX rate is missing', async () => {
    const transferRequest: TransferRequestDto = {
      source: 'Alice',
      destination: 'Bob',
      sourceCurrency: 'USD' as SupportedCurrency,
      sourceAmount: 100,
      destinationCurrency: 'XYZ' as SupportedCurrency,
      reference: 'txn123',
      narration: 'Payment for services',
    };
  
    const transferRepo = {
      save: jest.fn().mockResolvedValue({ id: 1, ...transferRequest, status: TransferStatus.Initiated }),
      update: jest.fn(),
      existsBy: jest.fn().mockResolvedValue(false),
    } as unknown as Repository<Transfers>;
  
    const rateRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(undefined),
      }),   
    //   getOne: jest.fn().mockResolvedValue(null),
    } as unknown as Repository<Rates>;
  
    const currencyRepo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      decrement: jest.fn(),
    } as unknown as Repository<Currencies>;
  
  
    manager.getRepository.mockImplementation((entity) => {
      if (entity === Transfers) {
        return transferRepo;
      } else if (entity === Rates) {
        return rateRepo;
      } else if (entity === Currencies) {
        return currencyRepo;
      }       
      throw new Error(`Unexpected entity: ${entity}`);
    });
  
    try {
      await transferService.transfer('idempotency-key', transferRequest);
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableRequest);
      if (error instanceof UnprocessableRequest) {
        expect(error.message).toBe('FX rate not available for currency pair');
      }
    }
  });
});
