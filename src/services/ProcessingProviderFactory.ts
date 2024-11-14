
import { SphereConfig } from '../config';
import { ProviderEnum } from '../interfaces/Providers';
import { ServerError } from '../utils/errors/ErrorHandlers';
import mockProcessorService from './MockProcessorService';

import { ProcessingProvider } from './ProcessingProvider';


export class ProviderFactory {

  private processingProvider;

  constructor() {

    this.processingProvider = SphereConfig.processingProvider;
    if (!this.processingProvider) {
      throw new ServerError({ message: 'Processing Provider is not configured ' });
    }
  }

  getProvider(): ProcessingProvider {
    switch (this.processingProvider) {

    case ProviderEnum.MOCK:
      return mockProcessorService;

    default:
    {
      throw new ServerError({ message: 'Invalid Processing Provider' });
    }
    }
  }

}

const processingProviderFactory = new ProviderFactory();
export default processingProviderFactory;