import type { Player } from "../entities/player.js";

export type MoveInput = {
    A: boolean;
    W: boolean;
    S: boolean;
    D: boolean;
};

export type MoveAxis = {
    x: number;
    y: number;
};

export const getMoveAxis = (
    input: MoveInput
): MoveAxis => {
    let x = 0;
    let y = 0;

    if (input.A) x -= 1;
    if (input.D) x += 1;
    if (input.W) y += 1;
    if (input.S) y -= 1;

    return { x, y };
};

export const move = (
    player: Player,
    axis: MoveAxis,
    deltaTime: number
): Player => ({
    ...player,
    x: player.x + axis.x * player.speed * deltaTime,
    y: player.y + axis.y * player.speed * deltaTime
});
