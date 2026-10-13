import type { WorldState } from "./state.js";
import type { WorldSnapshot } from "./protocol.js";
import type { ItemType } from "./entities/inventory.js";
import type { CurrencyType } from "./entities/currency.js";

export const toSnapshot = (s: WorldState): WorldSnapshot => ({
    players: [...s.players],
    plots: [...s.plots],
    plants: [...s.plants],
    inventory: [...s.inventory].map(
        ([id, inv]): [number, [ItemType, number][]] => [id, [...inv]]
    ),
    currency: [...s.currency].map(
        ([id, cur]): [number, [CurrencyType, number][]] => [id, [...cur]]
    ),
    shop: [...s.shop].map(
        ([id, items]): [number, [ItemType, number][]] => [id, [...items]]
    ),
});

export const fromSnapshot = (s: WorldSnapshot): WorldState => ({
    players: new Map(s.players),
    plots: new Map(s.plots),
    plants: new Map(s.plants),
    inventory: new Map(s.inventory.map(([id, inv]) => [id, new Map(inv)] as const)),
    currency: new Map(s.currency.map(([id, cur]) => [id, new Map(cur)] as const)),
    shop: new Map(s.shop.map(([id, items]) => [id, new Map(items)] as const)),
});
