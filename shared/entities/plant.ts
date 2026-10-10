import type { CropType,GrowthState } from './crop.js';

export type Condition =
    | 'ACTIVE'
    | 'WITHERED'
    | 'ROTEN';

export type PlantState = {
    growth: GrowthState;
    condition: Condition;
    isStopped: boolean;
    hasPest: boolean;
};

export type Plant = {
    id: number;
    plotId: number;
    plantedAt: number;
    cropType: CropType;
    state: PlantState;
};

export const createPlant = (
    id: number,
    plotId: number,
    plantedAt: number,
    cropType: CropType,
    state: PlantState,
): Plant => ({
    id,
    plotId,
    plantedAt,
    cropType,
    state,
});
