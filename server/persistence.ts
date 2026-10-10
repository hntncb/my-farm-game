import type { WorldSnapshot } from "../shared/protocol.js";
import { fromSnapshot, toSnapshot } from "../shared/snapshot.js";
import type { World } from "./core/world.js";
import { Scheduler, type ScheduledEvent } from "./scheduler/scheduler.js";

// Dang world duoc luu xuong database (mot cot jsonb).
export type StoredWorld = {
    snapshot: WorldSnapshot;
    nextPlantId: number;
    events: ScheduledEvent[];
};

export const serializeWorld = (world: World): StoredWorld => ({
    snapshot: toSnapshot(world),
    nextPlantId: world.nextPlantId,
    events: world.scheduler.snapshot(),
});

export const deserializeWorld = (stored: StoredWorld): World => ({
    ...fromSnapshot(stored.snapshot),
    nextPlantId: stored.nextPlantId,
    scheduler: new Scheduler(stored.events),
});
