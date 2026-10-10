export type CurrencyType = 'COIN' | 'GOLD';
export type PlayerCurrency = Map<CurrencyType, number>;
export type WorldCurrency = Map<number, Map<CurrencyType, number>>;