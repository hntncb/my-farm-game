export type CropType =
    | 'POTATO'
    | 'TOMATO';

export type GrowthState =
    | 'SEEDED'
    | 'SPROUT'
    | 'GROWING'
    | 'MATURE';

export type CropConfig = {
    growth: {
        sprout: number;
        growing: number;
        mature: number;
    };
    condition: {
        witherAfter: number;
        rottenAfter: number;
    };
    maxHp: number;

    water: {
        dryAfter: number;
    };

    weed: {
        checkAfter: number;
        chance: number;
    };

    pest: {
        checkAfter: number;
        chance: number;
    };
};
