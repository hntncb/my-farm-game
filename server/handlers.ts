import { ACTION_KINDS, SHOP_ACTION_KINDS, type ActionKind, type ClientMsg, type ShopActionKind } from "../shared/protocol.js";
import { CELL, GRID } from "../shared/constants.js";
import type { CropType } from "../shared/entities/crop.js";
import type { Plot } from "../shared/entities/plot.js";
import { harvestPlant, catchPest, planting } from "./actions/plantAction.js";
import { digPlot, tillPlot, waterPlot, weedPlot } from "./actions/plotActions.js";
import type { World } from "./core/world.js";
import { sendMsg, sendState, type Session } from "./session.js";
import { validatePlayer, validatePlot } from "./validation/validateEntities.js";
import type { ItemType } from "../shared/entities/inventory.js";

// ---------- Phan tich tin nhan tu client (du lieu khong dang tin) ----------
export const parseClientMsg = (text: string): ClientMsg | null => {
    let value: unknown;
    try {
        value = JSON.parse(text);
    } catch {
        return null;
    }
    if (typeof value !== "object" || value === null) return null;
    const m = value as Record<string, unknown>;

    switch (m.t) {
        case "hello":
            return typeof m.token === "string" ? { t: "hello", token: m.token } : null;

        case "move":
            return typeof m.x === "number" && typeof m.y === "number"
                ? { t: "move", x: m.x, y: m.y }
                : null;
        case "shop": {
            if (typeof m.action !== "string" || !(SHOP_ACTION_KINDS as readonly string[]).includes(m.action)) {
                return null;
            }
            if (typeof m.itemType !== "string") {
                return null;
            }
            if (typeof m.quantity !== "number" || m.quantity <= 0) {
                return null;
            }
            return {
                t: "shop",
                action: m.action as ShopActionKind,
                itemType: m.itemType as ItemType,
                quantity: m.quantity,
            };
        }

        case "act": {
            if (typeof m.plotId !== "number") return null;
            if (typeof m.kind !== "string" || !(ACTION_KINDS as readonly string[]).includes(m.kind)) {
                return null;
            }
            const base = { t: "act" as const, kind: m.kind as ActionKind, plotId: m.plotId };
            if (m.cropType === undefined) return base;
            if (m.cropType === "POTATO" || m.cropType === "TOMATO") {
                return { ...base, cropType: m.cropType };
            }
            return null;
        }

        default:
            return null;
    }
};

// ---------- Hanh dong ----------
type Handler = (world: World, playerId: number, plot: Plot, crop?: CropType) => void;

const plantIdOf = (plot: Plot): number => {
    if (plot.plantId === null) throw new Error("khong co cay");
    return plot.plantId;
};

const ACTIONS: Record<ActionKind, Handler> = {
    till:      (w, pid, p) => tillPlot(w, pid, p.id),
    water:     (w, pid, p) => waterPlot(w, pid, p.id),
    weed:      (w, pid, p) => weedPlot(w, pid, p.id),
    harvest:   (w, pid, p) => harvestPlant(w, pid, p.id, plantIdOf(p)),
    catchPest: (w, pid, p) => catchPest(w, pid, p.id, plantIdOf(p)),
    dig:       (w, pid, p) => digPlot(w, pid, p.id, plantIdOf(p)),
    plant:     (w, pid, p, c) => {
        if (c === undefined) throw new Error("thieu loai cay");
        planting(w, pid, p.id, w.nextPlantId++, c);
    },
};

// Nem loi neu hanh dong khong hop le; goi noi se bat va gui ve client.
export const handleAct = (
    session: Session,
    msg: Extract<ClientMsg, { t: "act" }>,
): void => {
    const plot = validatePlot(session.world, msg.plotId);
    ACTIONS[msg.kind](session.world, session.playerId, plot, msg.cropType);
    session.dirty = true;
    sendState(session);
};

// ---------- Di chuyen: client tu tinh, server chi kiem tra toc do ----------
const BOUNDS = { w: GRID * CELL, h: GRID * CELL };
const SPEED_TOLERANCE = 1.25;   // cho phep nhanh hon 25% do tre mang
const MAX_BUDGET_SECONDS = 0.5; // toi da tich luy quang duong tuong ung 0.5 giay di chuyen

export const newMoveBudget = (speed: number): number => speed * MAX_BUDGET_SECONDS;

export const handleMove = (
    session: Session,
    msg: Extract<ClientMsg, { t: "move" }>,
    now: number = Date.now(),
): void => {
    const player = validatePlayer(session.world, session.playerId);

    const elapsed = Math.max(now - session.lastMoveAt, 0) / 1000;
    session.lastMoveAt = now;
    session.moveBudget = Math.min(
        session.moveBudget + player.speed * elapsed * SPEED_TOLERANCE,
        newMoveBudget(player.speed),
    );

    const valid =
        Number.isFinite(msg.x) && Number.isFinite(msg.y) &&
        msg.x >= 0 && msg.x <= BOUNDS.w &&
        msg.y >= 0 && msg.y <= BOUNDS.h;
    const distance = valid ? Math.hypot(msg.x - player.x, msg.y - player.y) : Infinity;

    if (distance > session.moveBudget) {
        // Tu choi: giu nguyen vi tri va keo client ve.
        sendMsg(session, { t: "teleport", x: player.x, y: player.y });
        return;
    }

    session.moveBudget -= distance;
    player.x = msg.x;
    player.y = msg.y;
};
