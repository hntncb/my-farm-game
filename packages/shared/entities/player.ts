export type Player = {
    x: number,
    y: number,
    size: number,
    speed:number
};

export const createPlayer = (x: number, y: number): Player => ({
    x,
    y,
    size: 28,
    speed: 200
});
