import type { WorldState } from "../../shared/state.js";
import type { Scheduler } from "../scheduler/scheduler.js";

export type World = WorldState & { scheduler: Scheduler; nextPlantId: number };
