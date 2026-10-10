import type { World } from "../core/world.js";
import type { ItemType } from "../../shared/entities/inventory.js";
import type { CurrencyType } from "../../shared/entities/currency.js";

export const validatePlayer = (world: World, playerId: number) => {
    const player = world.players.get(playerId);
    if (!player) throw new Error("Khong tim thay player");
    return player;
};

export const validatePlot = (world: World, plotId: number) => {
    const plot = world.plots.get(plotId);
    if (!plot) throw new Error("Khong tim thay plot");
    return plot;
};

export const validatePlant = (world: World, plantId: number) => {
    const plant = world.plants.get(plantId);
    if (!plant) throw new Error("Khong tim thay plant");
    return plant;
};

export const validateInventory = (world: World, playerId: number): Map<ItemType, number> => {
    validatePlayer(world, playerId);
    let inventory = world.inventory.get(playerId);
    if (!inventory) {
        inventory = new Map<ItemType, number>();
        world.inventory.set(playerId, inventory);
    }

    return inventory;
};

export const validateCurrency = (world: World, playerId: number): Map<CurrencyType, number> => {
    validatePlayer(world, playerId);
    let currency = world.currency.get(playerId);
    if (!currency) {
        currency = new Map<CurrencyType, number>();
        world.currency.set(playerId, currency);
    }

    return currency;
};