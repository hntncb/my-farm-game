export type ItemType = 'POTATO_SEED' | 'TOMATO_SEED' | 'POTATO' | 'TOMATO' |'GRASS'|'BUG';
export type PlayerInventory = Map<ItemType, number>;
export type WorldInventory = Map<number, PlayerInventory>;
