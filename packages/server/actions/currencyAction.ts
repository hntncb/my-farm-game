import type { CurrencyType } from "../../shared/entities/currency.js";
import type { World } from "../core/world.js";
import { validateCurrency } from "../validation/validateEntities.js";

export const getCurrency = (
    world: World,
    playerId: number,
    currencyType: CurrencyType,
):number=>{
    const currency = validateCurrency(world, playerId);

    return currency.get(currencyType) ?? 0;
}

export const addCurrency = (
    world: World,
    playerId: number,
    currencyType: CurrencyType,
    amount: number
):void=>{
    if (amount <= 0) {
        throw new Error('amount phai la so duong');
    }

    const currency = validateCurrency(world, playerId);

    const currentCurrency = currency.get(currencyType) ?? 0;

    currency.set(currencyType, currentCurrency + amount);
}

export const spendCurrency = (
    world: World,
    playerId: number,
    currencyType: CurrencyType,
    amount: number
):void=>{
    if (amount <= 0) {
        throw new Error('amount phai la so duong');
    }

    const currency = validateCurrency(world, playerId);

    const currentCurrency = currency.get(currencyType) ?? 0;

    currency.set(currencyType, currentCurrency - amount);
}