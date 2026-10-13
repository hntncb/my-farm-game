import type { Plant } from "./entities/plant.js";
import type { Player } from "./entities/player.js";
import type { Plot } from "./entities/plot.js";
import type { ItemType } from "./entities/inventory.js";
import type { CurrencyType } from "./entities/currency.js";

export type WorldState = {
    players: Map<number, Player>;
    plots: Map<number, Plot>;
    plants: Map<number, Plant>;
    inventory: Map<number, Map<ItemType, number>>;
    currency: Map<number, Map<CurrencyType, number>>;
    shop: Map<number, Map<ItemType, number>>;
};
