import type { World } from "../core/world.js";
import type { ItemType } from "../../shared/entities/inventory.js";
import { validateInventory } from "../validation/validateEntities.js";

export const addItem = (
    world: World,
    playerId: number,
    itemType: ItemType,
    quantity: number
): void => {
    if (quantity <= 0) {
        throw new Error('Quantity phai la so duong');
    }
    const inventory = validateInventory(world, playerId);

    const currentQuantity = inventory.get(itemType) ?? 0;

    inventory.set(itemType, currentQuantity + quantity);
};

export const removeItem = (
    world: World,
    playerId: number,
    itemType: ItemType,
    quantity: number
): void => {
    if (quantity <= 0) {
        throw new Error('Quantity phai la so duong');
    }
    const inventory = validateInventory(world, playerId);
    const currentQuantity = inventory.get(itemType) ?? 0;

    if (currentQuantity < quantity) {
        throw new Error("Khong du vat pham trong kho");
    }

    inventory.set(itemType, currentQuantity - quantity);
};

export type SeedItem = {
  itemType: string;
  quantity: number;
};

export const getSeed = (
  world: World,
  playerId: number
): SeedItem[] => {
  const inventory = validateInventory(world, playerId);
  const seedList: SeedItem[] = [];

  inventory.forEach((quantity, itemType) => {
    if (typeof itemType === 'string' && itemType.toLowerCase().endsWith('_seed')) {
      seedList.push({ itemType, quantity });
    }
    });

  return seedList;
};