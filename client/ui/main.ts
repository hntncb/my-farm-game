import "./styles.css";
import { getMoveAxis, move } from "../../shared/core/move.js";
import { MOVE_SEND_MS } from "./config.js";
import { canvas, screenAxisToWorld } from "./canvas.js";
import { game } from "./store.js";
import { connect, sendMove } from "./network.js";
import { keys, setupInput } from "./input.js";
import { preloadImages } from "./images.js";
import { render } from "./render.js";
import { renderOverlay } from "./overlay.js";
import { renderInventory } from "./inventory.js";
import { renderSeedCell } from "./seedPanel.js";
import { renderShopCell } from "./shopPanel.js";
import { renderCurrency } from "./currencyPanel.js";
import { CELL, GRID } from "../../shared/constants.js";

connect();
preloadImages();
setupInput();

// ---------- Game loop ----------
let last = performance.now();
let lastSent = 0;

const loop = (now: number): void => {
    const dt = (now - last) / 1000;
    last = now;

    if (game.me) {
        const axis = getMoveAxis(keys);
        // Canvas co truc y huong xuong nen dao dau y
        const dir = screenAxisToWorld(axis.x, -axis.y);
        const moved = move(game.me, dir, dt);
        moved.x = Math.min(Math.max(moved.x, 0), GRID * CELL);
        moved.y = Math.min(Math.max(moved.y, 0), GRID * CELL);
        game.me = moved;

        if (now - lastSent >= MOVE_SEND_MS) {
            sendMove();
            lastSent = now;
        }
    }

    render();
    renderOverlay();
    renderShopCell();
    renderInventory();
    renderSeedCell();
    renderCurrency();
    requestAnimationFrame(loop);
};
requestAnimationFrame(loop);