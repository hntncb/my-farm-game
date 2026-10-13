import type { CropType } from "./entities/crop.js";
import type { CurrencyType } from "./entities/currency.js";
import type { ItemType } from "./entities/inventory.js";
import type { Plant } from "./entities/plant.js";
import type { Player } from "./entities/player.js";
import type { Plot } from "./entities/plot.js";

export type ActionKind =
    | 'till'
    | 'water'
    | 'plant'
    | 'weed'
    | 'harvest'
    | 'catchPest'
    | 'dig';

export type ShopActionKind = 'buy' | 'sell';

export const ACTION_KINDS: readonly ActionKind[] = [
    'till', 'water', 'plant', 'weed', 'harvest', 'catchPest', 'dig',
];

export const SHOP_ACTION_KINDS: readonly ShopActionKind[] = ['buy', 'sell'];

export type ClientMsg =
    | { t: 'hello'; token: string }
    | { t: 'move'; x: number; y: number }
    | { t: 'shop'; action: ShopActionKind; itemType: ItemType; quantity: number }
    | { t: 'act'; kind: ActionKind; plotId: number; cropType?: CropType };

// Map khong JSON hoa duoc nen snapshot dung mang cac cap [key, value].
export type WorldSnapshot = {
    players: [number, Player][];
    plots: [number, Plot][];
    plants: [number, Plant][];
    inventory: [number, [ItemType, number][]][];
    currency: [number, [CurrencyType, number][]][];
    shop: [number, [ItemType, number][]][];
};

export type ServerMsg =
    | { t: 'welcome'; playerId: number }
    | { t: 'state'; state: WorldSnapshot }
    | { t: 'teleport'; x: number; y: number }
    | { t: 'error'; message: string };
