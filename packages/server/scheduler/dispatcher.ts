import type { World } from "../core/world.js";
import { handleCheckPest, handlePlantGrow, handlePlantRotten, handlePlantWithered, handleSoilDry, handleWeedCheck } from "./handle.js";
import type { ScheduledEvent } from "./scheduler.js";

export const dispatchScheduledEvent = (
    event: ScheduledEvent,
    world: World,
): void => {
    switch (event.type) {
        case 'SOIL_DRY':
            return handleSoilDry(event, world);

        case 'WEED_CHECK':
            return handleWeedCheck(event, world);

        case 'PLANT_GROW':
            return handlePlantGrow(event, world);

        case 'CHECK_PEST':
            return handleCheckPest(event, world);

        case 'PLANT_ROTTEN':
            return handlePlantRotten(event, world);

        case 'PLANT_WITHERED':
            return handlePlantWithered(event, world);

    }
};
