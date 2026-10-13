import { GRID, CELL } from "../../shared/constants.js";
import { effectImage, isReady, moistureImage, plantConditionImage, plantImage, playerAvatarImage } from "./images.js";
import { COLOR } from "./config.js";
import { canvas, ctx, drawDiamond, drawImageContain, worldToIso } from "./canvas.js";
import { game } from "./store.js";

// Kich thuoc anh (o dat rong CELL x CELL/2 tren man hinh). Chinh o day neu muon to/nho hon.
const SIZE = {
    moisture: CELL * 0.50,
    weed: CELL * 0.22,
    plant: CELL * 0.80,
    pest: CELL * 0.18,
    avatar: CELL * 0.55,
    square: CELL * 0.3,
} as const;

// Khoang cach tu mep o dat den duong ke (px, theo chieu ngang) de o dat co vien
const PLOT_INSET = 1;
const drawPlotDiamond = (x: number, y: number, fill: string): void =>
    drawDiamond(x, y, fill, PLOT_INSET);

const soilColor = (soil: string): string => {
    if (soil === "TILLNED") return COLOR.tilled;
    if (soil === "HARVESTED") return COLOR.harvested;
    return COLOR.untilled;
};

type Drawable = { depth: number; draw: () => void };

export const render = (): void => {
    const { state, me, message } = game;

    ctx.fillStyle = COLOR.empty;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (!state || !me) {
        ctx.fillStyle = COLOR.text;
        ctx.font = "14px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("Dang ket noi...", 4, 4);
        ctx.fillStyle = COLOR.pest;
        ctx.fillText(message, 4, canvas.height - 20);
        return;
    }

    const drawables: Drawable[] = [];

    // ---------- Lop mat dat ----------
    for (const plot of state.plots.values()) {
        const { x, y } = worldToIso(plot.x, plot.y);

        drawPlotDiamond(x, y, soilColor(plot.state.soil));

        if (plot.state.soil === "UNTILLNED" || plot.state.moisture === "DRY") {
            drawPlotDiamond(x, y, "#8b5a2b");

            const img = moistureImage("DRY");
            if (isReady(img)) drawImageContain(img, x, y, SIZE.moisture);
        }

        if (plot.state.soil === "TILLNED") {
            const img = moistureImage("WET");
            if (isReady(img)) drawImageContain(img, x, y, SIZE.moisture);
        }

        if (plot.state.moisture === "WET") {
            drawPlotDiamond(x, y, "#522506");
        }

        if (plot.state.weeds === "WEEDY") {
            const img = effectImage("WEED");
            if (isReady(img)) drawImageContain(img, x, y, SIZE.weed);
        }

        // Cay duoc xep cung player de sap xep truoc/sau
        if (plot.plantId !== null) {
            const plant = state.plants.get(plot.plantId);
            if (plant) {
                drawables.push({
                    depth: plot.x + plot.y,
                    draw: () => {
                        // Goc cay nam o tam o dat, than cay moc len phia tren
                        const py = y - SIZE.plant * 0.3;
                        const img =
                            plant.state.condition === "ACTIVE"
                                ? plantImage(plant.cropType, plant.state.growth)
                                : plantConditionImage(plant.cropType, plant.state.condition);
                        if (isReady(img)) drawImageContain(img, x, py, SIZE.plant);

                        if (plant.state.hasPest) {
                            const pest = effectImage("PEST");
                            if (isReady(pest)) {
                                drawImageContain(pest, x + CELL * 0.2, py - CELL * 0.1, SIZE.pest);
                            }
                        }
                    },
                });
            }
        }
    }

    // ---------- Duong ke luoi hinh thoi ----------
    ctx.strokeStyle = COLOR.line;
    ctx.lineWidth = 1;
    const SPAN = GRID * CELL;
    for (let i = 0; i <= GRID; i++) {
        const a = worldToIso(i * CELL, 0);
        const b = worldToIso(i * CELL, SPAN);
        const c = worldToIso(0, i * CELL);
        const d = worldToIso(SPAN, i * CELL);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
    }

    // ---------- Player ----------
    drawables.push({
        depth: me.x + me.y,
        draw: () => {
            // (px, py) la vi tri chan player tren man hinh
            const { x: px, y: py } = worldToIso(me.x, me.y);
            const avatar = playerAvatarImage();
            if (avatar && isReady(avatar)) {
                drawImageContain(avatar, px, py - SIZE.avatar / 2, SIZE.avatar);
            } else {
                ctx.fillStyle = COLOR.player;
                ctx.fillRect(px - SIZE.square / 2, py - SIZE.square, SIZE.square, SIZE.square);
            }
        },
    });

    // Ve tu xa den gan (x + y cang lon cang gan nguoi xem)
    drawables.sort((a, b) => a.depth - b.depth);
    for (const d of drawables) d.draw();

    // HUD
    ctx.fillStyle = COLOR.text;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("1 cuốc |2|🧺 |3|🌱 |4|dọn cỏ |5|thu hoạch |6|🐞 |7|nhổ cây |I| kho đồ", 4, 4);
    ctx.fillStyle = COLOR.pest;
    ctx.fillText(message, 4, canvas.height - 16);
};