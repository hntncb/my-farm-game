import type { CropConfig, GrowthState } from "../../shared/entities/crop.js";
import type { Condition, Plant } from "../../shared/entities/plant.js";

type GrowthSchedule = {
    nextGrowthState: GrowthState | null;
    nextCondition: Condition | null;
    nextGrowthAt: number | null;
};

export const getNextGrowthSchedule = (
    plant: Plant,
    crop: CropConfig,
    now: number,
): GrowthSchedule => {
    if (plant.state.isStopped) {
        return {
            nextGrowthState: null,
            nextCondition: null,
            nextGrowthAt: null,
        };
    }

    switch (plant.state.growth) {
        case 'SEEDED':
            return {
                nextGrowthState: 'SPROUT',
                nextCondition: null,
                nextGrowthAt: now + crop.growth.sprout,
            };

        case 'SPROUT':
            return {
                nextGrowthState: 'GROWING',
                nextCondition: null,
                nextGrowthAt: now + crop.growth.growing,
            };

        case 'GROWING':
            return {
                nextGrowthState: 'MATURE',
                nextCondition: null,
                nextGrowthAt: now + crop.growth.mature,
            };

        case 'MATURE':
            return {
                nextGrowthState: null,
                nextCondition: 'ROTEN',
                nextGrowthAt: now + crop.condition.rottenAfter,
            };
    }
};
