import { SphereConfig } from '../config';
import { SupportedCurrency, StatusResponse } from '../interfaces';
import { ProviderEnum } from '../interfaces/Providers';
import { delay } from '../utils';
import { UnprocessableRequest } from '../utils/errors/ErrorHandlers';
import { Logger } from '../utils/Logger';
import { ProcessingProvider } from './ProcessingProvider';

export class MockProcessorService implements ProcessingProvider {


    provider(): ProviderEnum {
    return ProviderEnum.MOCK;
  }
  async process(request: { currency: SupportedCurrency; amount: number; }): Promise<StatusResponse> {

    const delayTime = SphereConfig.settlementTime[request.currency] * 1000;
    if (!delayTime ) {
        Logger.Error({  request,  message: 'SettlementConfig not available' });
        throw new UnprocessableRequest({ message: 'System cannot Settle Destination Currency' });

      }
    await delay(delayTime);

    return {
      successful: true,
      message: `Processed request for ${request.currency} with a delay of ${delayTime} seconds`,
    };


  }


    
}

const mockProcessorService = new MockProcessorService();
export default mockProcessorService;