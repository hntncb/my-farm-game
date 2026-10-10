import type { World } from "../core/world.js";
import { canInteract } from "../../shared/validation/validateDistance.js";
import { validatePlant, validatePlayer, validatePlot } from "../validation/validateEntities.js";
import { CROPS } from "../../shared/crop/crop-config.js";
import { addItem } from "./inventoryAction.js";

//validate
const validateWaterPlot = (world: World, playerId: number, plotId: number, now: number = Date.now()) => {
    const player = validatePlayer(world, playerId);
    const plot = validatePlot(world, plotId);

    if (!canInteract(player, plot)) {
        throw new Error('khoang cach qua xa');
    }
    if (plot.state.moisture === 'WET'){
        throw new Error('khong the tuoi o da uot');
    }
    let dryAfter = 30_000;
    if (plot.plantId !== null) {
        const plant = world.plants.get(plot.plantId);
        if (plant) {
            dryAfter = CROPS[plant.cropType].water.dryAfter;
        }
    }

    world.scheduler.schedule({
        type: 'SOIL_DRY',
        plotId: plot.id,
        executeAt: now + dryAfter,
    });
    return { player, plot };
};

const validateTillPlot = (world: World, playerId: number, plotId: number) => {
    const player = validatePlayer(world, playerId);
    const plot = validatePlot(world, plotId);
    
    canInteract(player, plot);
    if (plot.state.soil === 'TILLNED'){
        throw new Error('khong the cuoc');
    }
    return { player, plot };
};

const validateWeedPlot = (world: World, playerId: number, plotId: number) => {
    const player = validatePlayer(world, playerId);
    const plot = validatePlot(world, plotId);

    canInteract(player, plot);
    if (plot.state.weeds !== 'WEEDY'){
        throw new Error('khong the lam co');
    }
    return { player, plot };
};

const validateDigPlot = (world: World, playerId: number, plotId: number ,plantId: number) => {
    const player = validatePlayer(world, playerId);
    const plot = validatePlot(world, plotId);
    const plant = validatePlant(world, plantId);

    if (!plant) throw new Error("Khong tim thay plant");

    canInteract(player, plot);
    if (plot.plantId !== plant.id){
        throw new Error('khong the dao');
    }
    return { player, plot };
};

//action
export const waterPlot=(world: World, playerId: number, plotId: number): void =>{
    const { plot } = validateWaterPlot(world, playerId, plotId);
    plot.state.moisture = 'WET'
}

export const tillPlot=(world: World, playerId: number, plotId: number): void =>{
    const { plot } = validateTillPlot(world, playerId, plotId);
    plot.state.soil='TILLNED';
}

export const weedPlot=(world: World, playerId: number, plotId: number): void =>{
    const { plot } = validateWeedPlot(world, playerId, plotId);
    plot.state.weeds='CLEAN';
    addItem(world, playerId, 'GRASS', 1);
}

export const digPlot=(world: World, playerId: number, plotId: number,plantId: number): void =>{
    const { plot } = validateDigPlot(world, playerId, plotId, plantId);
    plot.plantId=null;
    plot.state.soil='UNTILLNED';
    world.plants.delete(plantId);
}
