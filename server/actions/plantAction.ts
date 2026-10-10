import type { World } from "../core/world.js";
import { CROPS } from "../../shared/crop/crop-config.js";
import type { CropType } from "../../shared/entities/crop.js";
import type { ItemType } from "../../shared/entities/inventory.js";
import { createPlant, type Plant } from "../../shared/entities/plant.js";
import { getNextGrowthSchedule } from "../growth/growth.js";
import { canInteract } from "../../shared/validation/validateDistance.js";
import { validatePlant, validatePlayer, validatePlot } from "../validation/validateEntities.js";
import { addItem } from "./inventoryAction.js";

const validateHarvestPlant = (world: World, playerId: number, plotId: number, plantId: number) => {
    const player = validatePlayer(world, playerId);
    const plot = validatePlot(world, plotId);
    const plant = validatePlant(world, plantId);

    canInteract(player, plot);
    if (plot.plantId !== plant.id){
        throw new Error('khong co cay');
    }
    if (plant.state.growth !== 'MATURE'){
        throw new Error('khong the thu hoach');
    }
    if (plant.state.condition === 'ROTEN'){
        throw new Error('khong the thu hoach');
    }
};

const validateCatchPest = (
    world: World, 
    playerId: number, 
    plotId: number, 
    plantId: number
) => {
    const player = validatePlayer(world, playerId);
    const plot = validatePlot(world, plotId);
    const plant = validatePlant(world, plantId);
    canInteract(player, plot);
    if (!plant.state.hasPest){
        throw new Error('khong the bat bo');
    }
};

const validatePlanting = (world: World, playerId: number, plotId: number) => {
    const player = validatePlayer(world, playerId);
    const plot = validatePlot(world, plotId);
    
    canInteract(player, plot);
    if (plot.plantId !== null){
        throw new Error('o nay da co cay');
    }
    if (plot.state.soil !== 'TILLNED'){
        throw new Error('o nay khong the trong cay');
    }
    if (plot.state.moisture !== 'WET'){
        throw new Error('khong the trong do dat kho');
    }
}

export const harvestPlant = (
    world: World, 
    playerId: number, 
    plotId: number, 
    plantId: number
): void =>{
    const plot = validatePlot(world, plotId);
    const plant = validatePlant(world, plantId);
    validateHarvestPlant(world, playerId, plotId, plantId);

    plant.state.condition = 'WITHERED';

    addItem(world, playerId, plant.cropType, 1);

    plot.plantId = null;
    plot.state.soil = 'HARVESTED';
    plot.state.weeds = 'CLEAN';
    addItem(world, playerId, 'GRASS', 1);
    world.plants.delete(plant.id);
}

export const catchPest=(world: World, playerId: number, plotId: number, plantId: number): void =>{
    const plant = validatePlant(world, plantId);

    validateCatchPest(world, playerId, plotId, plantId);
    addItem(world, playerId, 'BUG', 1);
    plant.state.hasPest=false;
}

export const planting = (
    world: World,
    playerId: number,
    plotId: number,
    plantId: number,
    cropType: CropType,
    now: number = Date.now()
): Plant => {
    const plot = validatePlot(world, plotId);
    validatePlanting(world, playerId, plotId);

    const plant = createPlant(
        plantId,
        plot.id,
        now,
        cropType,
        {
            growth: 'SEEDED',
            condition: 'ACTIVE',
            isStopped: false,
            hasPest: false,
        }
    );

    plot.plantId = plant.id;
    addItem(world, playerId, `${cropType}_SEED` as ItemType, 1);
    world.plants.set(plant.id, plant);

    const crop = CROPS[cropType];
    const g = getNextGrowthSchedule(plant, crop, now);
    if (g.nextGrowthAt !== null) {
        world.scheduler.schedule({ type: 'PLANT_GROW', plantId: plant.id, executeAt: g.nextGrowthAt });
    }
    world.scheduler.schedule({ type: 'SOIL_DRY', plotId: plot.id, executeAt: now + crop.water.dryAfter });
    world.scheduler.schedule({ type: 'WEED_CHECK', plotId: plot.id, executeAt: now + crop.weed.checkAfter });
    world.scheduler.schedule({ type: 'CHECK_PEST', plantId: plant.id, executeAt: now + crop.pest.checkAfter });

    return plant;
};
