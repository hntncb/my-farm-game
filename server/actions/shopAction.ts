import { SHOP_CONFIG } from "../../shared/config/shop-config.js"
import type { CurrencyType } from "../../shared/entities/currency.js"
import type { ItemType } from "../../shared/entities/inventory.js"
import type { World } from "../core/world.js"
import { addCurrency, spendCurrency } from "./currencyAction.js"
import { addItem, removeItem } from "./inventoryAction.js"

export const getAvailableStonk = (world: World, playerId: number, itemType: ItemType): number => {
    const playerShop = world.shop.get(playerId);
    if (!playerShop) return 0;
    const availableStonk = playerShop.get(itemType)??0;
    return availableStonk;
};

const validateCanBuy =(
    world: World,
    playerId: number,
    item: ItemType,
    quantity: number
):void =>{
    const playerShop = world.shop.get(playerId);
    const playerCurrency = world.currency.get(playerId);
    let currentCurrnency = playerCurrency?.get("COIN")??0;
    if (!playerShop) {
        throw new Error("Không tìm thấy cửa hàng của người chơi");
    }
    if (currentCurrnency <= 0) {
        throw new Error("Không đủ tiền");
    };
    const availableStonk = getAvailableStonk(world, playerId,item);
    if(availableStonk < quantity){
        throw new Error("khong du so luong");
    }
    playerShop.set(item, availableStonk - quantity);
}

export const sellForPlayer = (
    world: World,
    playerId: number,
    item: ItemType,
    currency: CurrencyType,
    quantity: number,
): void=>{
    const amount = SHOP_CONFIG[item]?.price.sellForPlayer;
    if (!amount) {
        throw new Error("Không tìm thấy cấu hình vật phẩm trong cửa hàng");
    }
    validateCanBuy(world,playerId,item,quantity);
    addItem(world,playerId,item,quantity);
    spendCurrency(world,playerId,currency,amount);
}

export const buyFromPlayer = (
    world: World,
    playerId: number,
    item: ItemType,
    currency: CurrencyType,
    quantity: number,
): void=>{
    const amount = SHOP_CONFIG[item]?.price.sellForPlayer;
    if (!amount) {
        throw new Error("Không tìm thấy cấu hình vật phẩm trong cửa hàng");
    }
    removeItem(world,playerId,item,quantity);
    addCurrency(world,playerId,currency,amount);
}