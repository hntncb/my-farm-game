import type { CropType, CropConfig } from "../entities/crop.js";

export const CROPS: Record<CropType, CropConfig> = {
    POTATO: {
        growth: {
            sprout: 10_000,
            growing: 20_000,
            mature: 30_000,
        },
        condition: {
            witherAfter: 20_000,
            rottenAfter: 20_000,
        },
        maxHp: 100,
        water: {
            dryAfter: 30_000,
        },
        weed: {
            checkAfter: 20_000,
            chance: 0.1,
        },
        pest: {
            checkAfter: 15_000,
            chance: 0.05,
        },
    },

    TOMATO: {
        growth: {
            sprout: 15_000,
            growing: 40_000,
            mature: 90_000,
        },
        condition: {
            witherAfter: 20_000,
            rottenAfter: 20_000,
        },
        maxHp: 80,
        water: {
            dryAfter: 20_000,
        },
        weed: {
            checkAfter: 15_000,
            chance: 0.15,
        },
        pest: {
            checkAfter: 10_000,
            chance: 0.1,
        },
    },
};
