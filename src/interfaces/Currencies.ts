
export enum SupportedCurrency {
    USD = 'USD',
    EUR = 'EUR',
    GBP = 'GBP',
    JPY = 'JPY',
    AUD = 'AUD',

}

export interface ICurrencySeed  {
    name: SupportedCurrency,
    initialBalance: number,
    

}