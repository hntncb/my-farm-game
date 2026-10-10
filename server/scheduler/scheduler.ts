type EventOf<T extends ScheduledEvent['type']> = Extract<ScheduledEvent, { type: T }>;
export type SoilDryEvent = EventOf<'SOIL_DRY'>;
export type WeedCheckEvent = EventOf<'WEED_CHECK'>;
export type PlantGrowEvent = EventOf<'PLANT_GROW'>;
export type CheckPestEvent = EventOf<'CHECK_PEST'>;
export type PlantWitheredEvent = EventOf<'PLANT_WITHERED'>;
export type PlantRotenEvent = EventOf<'PLANT_ROTTEN'>;

export type ScheduledEvent =
    | {
        type: 'SOIL_DRY';
        plotId: number;
        executeAt: number;
    }
    | {
        type: 'WEED_CHECK';
        plotId: number;
        executeAt: number;
    }
    | {
        type: 'PLANT_GROW';
        plantId: number;
        executeAt: number;
    }
    | {
        type: 'CHECK_PEST';
        plantId: number;
        executeAt: number;
    }
    | {
        type: 'PLANT_WITHERED';
        plantId: number;
        executeAt: number;
    }
    | {
        type: 'PLANT_ROTTEN';
        plantId: number;
        executeAt: number;
    }

export class Scheduler {
    private queue: ScheduledEvent[];

    constructor(events: ScheduledEvent[] = []) {
        this.queue = events.map((e) => ({ ...e })).sort((a, b) => a.executeAt - b.executeAt);
    }

    schedule(event: ScheduledEvent): void {
        this.queue.push(event);
        this.queue.sort((a, b) => a.executeAt - b.executeAt);
    }

    popDue(now: number): ScheduledEvent[] {
        const i = this.queue.findIndex(e => e.executeAt > now);
        return this.queue.splice(0, i === -1 ? this.queue.length : i);
    }

    // Ban sao hang doi hien tai, dung de luu xuong database.
    snapshot(): ScheduledEvent[] {
        return this.queue.map((e) => ({ ...e }));
    }
}
