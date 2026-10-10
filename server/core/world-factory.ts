import { createPlayer } from "../../shared/entities/player.js";
import { createPlot } from "../../shared/entities/plot.js";
import { cellCenter } from "../../shared/constants.js";
import { Scheduler } from "../scheduler/scheduler.js";
import { addItem } from "../actions/inventoryAction.js";
import type { World } from "./world.js";
import { addCurrency } from "../actions/currencyAction.js";
import type { ItemType } from "../../shared/entities/inventory.js";
import { Shop } from "../../shared/entities/shop.js";

// 9 o dat (3x3) o giua luoi 5x5
export const createWorld = (playerId: number): World => {
    const plots = Array.from({ length: 9 }, (_, i) => {
        const col = 2 + (i % 3);
        const row = 2 + Math.floor(i / 3);
        return createPlot(
            i + 1,
            cellCenter(col),
            cellCenter(row),
            { moisture: "DRY", soil: "UNTILLNED", weeds: "CLEAN" },
            null
        );
    });
    const initialShopItems = new Map<ItemType, number>();
    
    for (const [itemType, config] of Object.entries(Shop)) {
        initialShopItems.set(itemType as ItemType, config.availableStonk);
    }
    const world: World = {
        players: new Map([[playerId, createPlayer(cellCenter(1), cellCenter(1))]]),
        plots: new Map(plots.map((p) => [p.id, p])),
        plants: new Map(),
        inventory: new Map(),
        currency: new Map(),
        shop: new Map([[playerId, initialShopItems]]),
        scheduler: new Scheduler(),
        nextPlantId: 1,
    };

    addItem(world, playerId, "POTATO_SEED", 10);
    addItem(world, playerId, "TOMATO_SEED", 3);
    addItem(world, playerId, "POTATO", 1);
    addItem(world, playerId, "TOMATO", 1);
    addCurrency(world, playerId, 'COIN', 5000);

    return world;
};
