import type { World } from "../core/world.js";
import { CROPS } from "../../shared/config/crop-config.js";
import { getNextGrowthSchedule } from "../growth/growth.js";
import type { CheckPestEvent, PlantGrowEvent, PlantRotenEvent, PlantWitheredEvent, SoilDryEvent, WeedCheckEvent } from "./scheduler.js";

export const handleSoilDry = (
    event: SoilDryEvent,
    world: World
)=> {
    const plot = world.plots.get(event.plotId);

    if(!plot){
        return;
    }

    plot.state.moisture = 'DRY';
    if(plot.plantId === null){
        plot.state.soil = 'UNTILLNED';
    }
    if (plot.plantId !== null) {
        const plant = world.plants.get(plot.plantId);
        if (plant && plant.state.condition === 'ACTIVE') {
            const crop = CROPS[plant.cropType];
            
            world.scheduler.schedule({
                type: 'PLANT_WITHERED',
                plantId: plant.id,
                executeAt: event.executeAt + crop.condition.witherAfter,
            });
        }
    }
};

export const handleWeedCheck = (
    event: WeedCheckEvent,
    world: World
): void => {
    const plot = world.plots.get(event.plotId);
    
    if (!plot || plot.plantId === null) return;

    const plant = world.plants.get(plot.plantId);
    if (!plant) return;
    //if (plot.plantId !== event.plantId) return;
    const crop = CROPS[plant.cropType];

    if (Math.random() < crop.weed.chance) {
        plot.state.weeds = 'WEEDY';
    }

    world.scheduler.schedule({
        type: 'WEED_CHECK',
        plotId: plot.id,
        executeAt: event.executeAt + crop.weed.checkAfter,
    });
};

export const handlePlantGrow = (
    event: PlantGrowEvent,
    world: World
): void => {
    const plant = world.plants.get(event.plantId);
    if (!plant || plant.state.condition !== 'ACTIVE') return;

    const crop = CROPS[plant.cropType];
    const current = getNextGrowthSchedule(plant, crop, event.executeAt);

    if (current.nextGrowthState) {
        plant.state.growth = current.nextGrowthState;
    } else if (current.nextCondition) {
        plant.state.condition = current.nextCondition;
        return;
    }

    const next = getNextGrowthSchedule(plant, crop, event.executeAt);
    if ((next.nextGrowthState || next.nextCondition) && next.nextGrowthAt !== null) {
        world.scheduler.schedule({
            type: 'PLANT_GROW',
            plantId: plant.id,
            executeAt: next.nextGrowthAt,
        });
    }
};

export const handleCheckPest = (
    event: CheckPestEvent,
    world: World,
) : void => {
    const plant = world.plants.get(event.plantId);
    if (!plant || plant.state.condition !== 'ACTIVE') return;

    const crop = CROPS[plant.cropType];

    if (Math.random() < crop.pest.chance) {
        plant.state.hasPest = true;
    }

    world.scheduler.schedule({
        type: 'CHECK_PEST',
        plantId: plant.id,
        executeAt: event.executeAt + crop.pest.checkAfter,
    });
};

export const handlePlantRotten = (
    event: PlantRotenEvent,
    world: World,
):void=>{
    const plant = world.plants.get(event.plantId);
    if (!plant) return;

    const crop = CROPS[plant.cropType];
    plant.state.condition = 'ROTEN';
    world.scheduler.schedule({
        type: 'PLANT_ROTTEN',
        plantId: plant.id,
        executeAt: event.executeAt + crop.condition.rottenAfter
    });
}

export const handlePlantWithered = (
    event: PlantWitheredEvent,
    world: World,
):void=>{
    const plant = world.plants.get(event.plantId);
    if (!plant) return;

    const crop = CROPS[plant.cropType];

    plant.state.condition = 'WITHERED';

    world.scheduler.schedule({
        type: 'PLANT_WITHERED',
        plantId: plant.id,
        executeAt: event.executeAt + crop.condition.witherAfter
    });
};

