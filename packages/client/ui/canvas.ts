import { GRID, CELL } from "../../shared/constants.js";

export const canvas = document.getElementById("game") as HTMLCanvasElement;
canvas.width = GRID * CELL;
canvas.height = GRID * CELL;

const context = canvas.getContext("2d");
if (!context) throw new Error("canvas 2d khong kha dung");
export const ctx: CanvasRenderingContext2D = context;

export const HALF_W = CELL / 2;
export const HALF_H = CELL / 4;

// Toa do the gioi (phang, dung chung voi server) -> toa do pixel tren man hinh iso.
// (0,0) la goc tren cung cua hinh thoi lon, (GRID*CELL, GRID*CELL) la goc duoi cung.
const OFFSET_Y = (canvas.height - GRID * HALF_H * 2) / 2;

export const worldToIso = (x: number, y: number) => ({
    x: ((x - y) / CELL) * HALF_W + canvas.width / 2,
    y: ((x + y) / CELL) * HALF_H + OFFSET_Y,
});

// Nguoc lai: pixel tren canvas -> toa do the gioi phang.
export const isoToWorld = (sx: number, sy: number) => {
    const a = (sx - canvas.width / 2) / HALF_W; // = u - v
    const b = sy / HALF_H;                      // = u + v
    return {
        x: ((a + b) / 2) * CELL,
        y: ((b - a) / 2) * CELL,
    };
};

// Phim: sx > 0 la sang phai, sy > 0 la xuong duoi (theo man hinh).
// Tra ve vector don vi trong the gioi phang de truyen cho move().
export const screenAxisToWorld = (sx: number, sy: number) => {
    const dx = sx + sy;
    const dy = sy - sx;
    const len = Math.hypot(dx, dy);
    return len === 0 ? { x: 0, y: 0 } : { x: dx / len, y: dy / len };
};

// inset: so pixel thu nho theo chieu ngang, giu ti le 2:1 de tao vien quanh o
export const drawDiamond = (
    cx: number,
    cy: number,
    fill: string,
    inset = 0
): void => {
    const hw = HALF_W - inset;
    const hh = hw / 2;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
    ctx.fill();
};

export const drawImageContain = (
    img: HTMLImageElement,
    cx: number,
    cy: number,
    box: number
): void => {
    if (!img.naturalWidth || !img.naturalHeight) return;

    const scale = Math.min(
        box / img.naturalWidth,
        box / img.naturalHeight
    );
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
};