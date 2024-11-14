import { StatusResponse, SupportedCurrency } from '../interfaces';
import { ProviderEnum } from '../interfaces/Providers';



export interface ProcessingProvider {


    provider() :ProviderEnum
    process(request: {currency: SupportedCurrency, amount: number}): Promise<StatusResponse>

}