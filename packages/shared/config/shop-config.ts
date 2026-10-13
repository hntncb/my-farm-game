import type { ItemType } from "../entities/inventory.js";
import type { ItemInfo } from "../entities/shop.js";

export const SHOP_CONFIG: Partial<Record<ItemType, ItemInfo>> = {
    POTATO_SEED: {
        price: {
            buyFromPlayer: 50,
            sellForPlayer: 100
        },
        availableStonk: 100
    },
    TOMATO_SEED: {
        price: {
            buyFromPlayer: 80,
            sellForPlayer: 150
        },
        availableStonk: 100
    },
    POTATO: {
        price: {
            buyFromPlayer: 100,
            sellForPlayer: 200
        },
        availableStonk: 10
    },
    TOMATO: {
        price: {
            buyFromPlayer: 150,
            sellForPlayer: 300
        },
        availableStonk: 10
    }
};