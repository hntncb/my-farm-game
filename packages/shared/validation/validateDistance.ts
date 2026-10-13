import type { Player } from "../entities/player.js";
import type { Plot } from "../entities/plot.js";

const INTERACTION_RANGE = 50;

export const canInteract = (player: Player, plot: Plot): boolean => {
    const dx = player.x - plot.x;
    const dy = player.y - plot.y;
    return dx * dx + dy * dy <= INTERACTION_RANGE * INTERACTION_RANGE;
};

export const assertCanInteract = (player: Player, plot: Plot): void => {
    if (!canInteract(player, plot)) {
        throw new Error("Khoảng cách quá xa");
    }
};