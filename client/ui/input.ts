import type { ActionKind } from "../../shared/protocol.js";
import type { MoveInput } from "../../shared/core/move.js";
import { canInteract } from "../../shared/validation/validateDistance.js";
import { game, showMessage } from "./store.js";
import { send, sendMove } from "./network.js";
import { getSeedSeleted } from "./seedPanel.js";

export const keys: MoveInput = { A: false, W: false, S: false, D: false };
const KEY_MAP: Record<string, keyof MoveInput> = { a: "A", w: "W", s: "S", d: "D" };

const KEY_ACTION: Record<string, ActionKind> = {
    "1": "till",
    "2": "water",
    "3": "plant",
    "4": "weed",
    "5": "harvest",
    "6": "catchPest",
    "7": "dig",
};

const nearestPlot = () => {
    if (!game.state || !game.me) return undefined;
    const player = game.me;
    return [...game.state.plots.values()].find((plot) => canInteract(player, plot));
};

export const setupInput = (): void => {
    addEventListener("keydown", (e) => {
        const k = KEY_MAP[e.key.toLowerCase()];
        if (k) keys[k] = true;
    });
    addEventListener("keyup", (e) => {
        const k = KEY_MAP[e.key.toLowerCase()];
        if (k) keys[k] = false;
    });

    addEventListener("keydown", (e) => {
        if (e.repeat) return;
        const kind = KEY_ACTION[e.key];
        if (!kind) return;

        const plot = nearestPlot();
        if (!plot) {
            showMessage("dung gan mot o dat");
            return;
        }

        // Gui vi tri moi nhat truoc de server kiem tra khoang cach chinh xac.
        sendMove();
        const seedSelected = getSeedSeleted();
        if (kind === "plant") {
            if (seedSelected === null) {
                console.log("Bạn chưa chọn hạt giống!");
                return;
            }

            send({
                t: "act",
                kind,
                plotId: plot.id,
                cropType: seedSelected,
            });
        } else {
            send({
                t: "act",
                kind,
                plotId: plot.id,
            });
        }
    });
};
