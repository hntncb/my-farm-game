import type { ItemType } from "../../shared/entities/inventory.js";

type ItemInfo = {
    price:{
        buyFromPlayer: number,
        sellForPlayer: number
    };
    availableStonk: number
}

export const Shop: Partial<Record<ItemType, ItemInfo>>={
    POTATO_SEED:{
        price:{
            buyFromPlayer: 100,
            sellForPlayer: 150
        },
        availableStonk: 100
    },
    TOMATO_SEED:{
        price:{
            buyFromPlayer: 100,
            sellForPlayer: 150
        },
        availableStonk: 100
    },
    POTATO:{
        price:{
            buyFromPlayer: 100,
            sellForPlayer: 150
        },
        availableStonk: 10
    },
    TOMATO:{
        price:{
            buyFromPlayer: 100,
            sellForPlayer: 150
        },
        availableStonk: 10
    }
}