export type Moisture = 'DRY'|'WET';
export type SoilState = 'UNTILLNED'|'TILLNED'|'HARVESTED';
export type WeedState = 'CLEAN'|'WEEDY';

export type plotState = {
    moisture: Moisture;
    soil: SoilState;
    weeds: WeedState;
};

export type Plot = {
    id: number,
    x: number,
    y: number,
    state: plotState,
    plantId: number | null;
};
export const createPlot = (
    id: number,
    x: number,
    y: number,
    state: plotState,
    plantId: number | null
): Plot => ({
    id,
    x,
    y,
    state,
    plantId,
});
