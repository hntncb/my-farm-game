import type { CurrencyType } from "../../shared/entities/currency.js"
import type { ItemType } from "../../shared/entities/inventory.js"
import type { World } from "../core/world.js"
import { addCurrency, spendCurrency } from "./currencyAction.js"
import { addItem, removeItem } from "./inventoryAction.js"

const validateCanBuy =(
    world: World,
    playerId: number,
    item: ItemType,
    quantity: number
):void =>{
    const playerShop = world.shop.get(playerId);
    if (!playerShop) {
        throw new Error("Không tìm thấy cửa hàng của người chơi");
    }

    const availableStonk = playerShop?.get(item) ?? 0;

    if(availableStonk < quantity){
        throw new Error("khong du so luong");
    }
}

export const sellForPlayer = (
    world: World,
    playerId: number,
    item: ItemType,
    currency: CurrencyType,
    quantity: number,
    amount: number
): void=>{
    validateCanBuy;
    addItem(world,playerId,item,quantity);
    spendCurrency(world,playerId,currency,amount);
}

export const buyFromPlayer = (
    world: World,
    playerId: number,
    item: ItemType,
    currency: CurrencyType,
    quantity: number,
    amount: number
): void=>{
    removeItem(world,playerId,item,quantity);
    addCurrency(world,playerId,currency,amount);
}

(window as any).sellForPlayer=sellForPlayer;
(window as any).buyFromPlayer=buyFromPlayer;