import type { ActionKind, ClientMsg, ServerMsg } from "../../shared/protocol.js";
import type { WorldState } from "../../shared/state.js";
import type { Player } from "../../shared/entities/player.js";
import type { ItemType } from "../../shared/entities/inventory.js";
import { fromSnapshot } from "../../shared/snapshot.js";
import { GRID, CELL } from "../../shared/constants.js";
import { getMoveAxis, move, type MoveInput } from "../../shared/core/move.js";
import { canInteract } from "../../shared/validation/validateDistance.js";
import { effectImage, isReady, itemImageUrl, moistureImage, plantImage, preloadImages } from "./images.js";

const WS_URL: string =
    import.meta.env.VITE_WS_URL ?? `ws://${location.hostname}:3000/ws`;
const TOKEN_KEY = "farm-token";
const MOVE_SEND_MS = 100;

const COLOR = {
    empty: "#d9e4c8",
    untilled: "#8b5a2b",
    tilled: "#5c3a1a",
    harvested: "#a68a64",
    wet: "#2f6fdb",
    weed: "#3a8f3a",
    pest: "#d93a3a",
    player: "#2f6fdb",
    line: "#00000033",
    text: "#000000",
} as const;

// ---------- Dinh danh nguoi choi (tam thoi, truoc khi co dang nhap) ----------
const uuid = (): string => {
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6]! & 0x0f) | 0x40;
    b[8] = (b[8]! & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

const getToken = (): string => {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        token = uuid();
        localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
};

// ---------- Trang thai ----------
let state: WorldState | null = null; // snapshot moi nhat tu server
let playerId: number | null = null;
let me: Player | null = null;        // vi tri do client tu tinh
let message = "";

const showMessage = (text: string): void => {
    message = text;
    setTimeout(() => {
        if (message === text) message = "";
    }, 2000);
};

// ---------- Ket noi ----------
let ws: WebSocket | null = null;
let sentX = NaN;
let sentY = NaN;

const send = (msg: ClientMsg): void => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
};

const sendMove = (): void => {
    if (!me || (me.x === sentX && me.y === sentY)) return;
    sentX = me.x;
    sentY = me.y;
    send({ t: "move", x: me.x, y: me.y });
};

const connect = (): void => {
    const socket = new WebSocket(WS_URL);
    ws = socket;

    socket.onopen = () => send({ t: "hello", token: getToken() });

    socket.onmessage = (e) => {
        const msg = JSON.parse(e.data as string) as ServerMsg;
        switch (msg.t) {
            case "welcome":
                playerId = msg.playerId;
                break;
            case "state": {
                state = fromSnapshot(msg.state);
                (window as any).__WORLD_STATE__ = state;
                (window as any).__RAW_SNAPSHOT__ = msg.state;
                // Chi lay vi tri tu server o lan dau; sau do client tu tinh.
                if (!me && playerId !== null) {
                    const p = state.players.get(playerId);
                    if (p) me = { ...p };
                }
                break;
            }
            case "teleport":
                if (me) me = { ...me, x: msg.x, y: msg.y };
                break;
            case "error":
                showMessage(msg.message);
                break;
        }
    };

    socket.onclose = () => {
        if (ws !== socket) return;
        state = null;
        me = null;
        playerId = null;
        sentX = NaN;
        sentY = NaN;
        showMessage("mat ket noi, dang thu lai...");
        setTimeout(connect, 1000);
    };
};
connect();

// ---------- Canvas ----------
const canvas = document.getElementById("game") as HTMLCanvasElement;
canvas.width = GRID * CELL;
canvas.height = GRID * CELL;

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("canvas 2d khong kha dung");

preloadImages();

// Ve anh vao giua (cx, cy), vua trong o vuong canh `box`, giu ty le.
const drawImageContain = (img: HTMLImageElement, cx: number, cy: number, box: number): void => {
    const scale = Math.min(box / img.naturalWidth, box / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
};

// ---------- Input ----------
const keys: MoveInput = { A: false, W: false, S: false, D: false };
const KEY_MAP: Record<string, keyof MoveInput> = { a: "A", w: "W", s: "S", d: "D" };

addEventListener("keydown", (e) => {
    const k = KEY_MAP[e.key.toLowerCase()];
    if (k) keys[k] = true;
});
addEventListener("keyup", (e) => {
    const k = KEY_MAP[e.key.toLowerCase()];
    if (k) keys[k] = false;
});

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
    if (!state || !me) return undefined;
    const player = me;
    return [...state.plots.values()].find((plot) => canInteract(player, plot));
};

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
    send({
        t: "act",
        kind,
        plotId: plot.id,
        ...(kind === "plant" ? { cropType: "POTATO" as const } : {}),
    });
});

// ---------- Render ----------
const soilColor = (soil: string): string => {
    if (soil === "TILLNED") return COLOR.tilled;
    if (soil === "HARVESTED") return COLOR.harvested;
    return COLOR.untilled;
};



const render = (): void => {
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

    for (const plot of state.plots.values()) {
        const left = plot.x - CELL / 2;
        const top = plot.y - CELL / 2;

        ctx.fillStyle = soilColor(plot.state.soil);
        ctx.fillRect(left, top, CELL, CELL);

        if (plot.state.soil === 'UNTILLNED' || plot.state.moisture === 'DRY') {
            const img = moistureImage("DRY");
            if (isReady(img)) drawImageContain(img, left + 32, top + 32, 64);
        }
        if (plot.state.soil === 'TILLNED' && plot.state.moisture !== "WET") {
            const img = moistureImage("WET");
            if (isReady(img)) drawImageContain(img, left + 32, top + 32, 64);
        }

        if (plot.state.moisture === "WET") {
            ctx.fillStyle = "#361802";
            ctx.fillRect(left, top, CELL, CELL);
            const img = moistureImage("WET");
            if (isReady(img)) drawImageContain(img, left + 32, top + 32, 64);
        }

        if (plot.state.weeds === "WEEDY") {
            const img = effectImage("WEED");
            if (isReady(img)) drawImageContain(img, left + 16, top + 16, 24);
        }

        if (plot.plantId !== null) {
            const plant = state.plants.get(plot.plantId);
            if (plant) {
                const img = plantImage(plant.cropType, plant.state.growth);
                if (isReady(img)) drawImageContain(img, plot.x, plot.y, CELL - 8);

                if (plant.state.hasPest) {
                    const img = effectImage("PEST");
                    if (isReady(img)) drawImageContain(img, left + CELL - 16, top + 16, 24);
                }
            }
        }
    }

    // Duong ke luoi
    ctx.strokeStyle = COLOR.line;
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL + 0.5, 0);
        ctx.lineTo(i * CELL + 0.5, canvas.height);
        ctx.moveTo(0, i * CELL + 0.5);
        ctx.lineTo(canvas.width, i * CELL + 0.5);
        ctx.stroke();
    }

    // Player
    ctx.fillStyle = COLOR.player;
    ctx.fillRect(me.x - me.size / 2, me.y - me.size / 2, me.size, me.size);

    // HUD
    ctx.fillStyle = COLOR.text;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("1 cuoc|2 tuoi|3 trong|4 lam co|5 thu hoach|6 bat sau|7 dao|I kho do", 4, 4);
    ctx.fillStyle = COLOR.pest;
    ctx.fillText(message, 4, canvas.height - 16);
};

// ---------- Overlay ----------
let hoveredPlotId: number | null = null;

const overlay = document.createElement("pre");
overlay.style.cssText =
    "position:fixed;top:8px;left:8px;margin:0;padding:8px 10px;" +
    "background:#000c;color:#fff;font:12px monospace;border-radius:4px;" +
    "pointer-events:none;display:none";
document.body.appendChild(overlay);

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    hoveredPlotId = null;
    for (const plot of state?.plots.values() ?? []) {
        if (Math.abs(mx - plot.x) <= CELL / 2 && Math.abs(my - plot.y) <= CELL / 2) {
            hoveredPlotId = plot.id;
            break;
        }
    }
});

canvas.addEventListener("mouseleave", () => {
    hoveredPlotId = null;
});

const LABEL = {
    soil: { UNTILLNED: "Chưa cuốc", TILLNED: "Đã cuốc", HARVESTED: "Đã thu hoạch" },
    moisture: { DRY: "Khô", WET: "Ẩm" },
    weeds: { CLEAN: "Sạch", WEEDY: "Có cỏ" },
    crop: { POTATO: "Khoai tây", TOMATO: "Cà chua" },
    growth: { SEEDED: "Hạt giống", SPROUT: "Nảy mầm", GROWING: "Đang lớn", MATURE: "Chín" },
    condition: { ACTIVE: "Phát triển", WITHERED: "Héo", ROTEN: "Thối" },
} as const;

const row = (label: string, value: string): string => `${label.padEnd(11)}${value}`;

const renderOverlay = (): void => {
    const plot = hoveredPlotId !== null ? state?.plots.get(hoveredPlotId) : undefined;
    if (!plot) {
        overlay.style.display = "none";
        return;
    }
    const plant = plot.plantId !== null ? state?.plants.get(plot.plantId) : undefined;

    const lines = [
        `Ô đất #${plot.id}`,
        row("Đất:", LABEL.soil[plot.state.soil]),
        row("Độ ẩm:", LABEL.moisture[plot.state.moisture]),
        row("Cỏ dại:", LABEL.weeds[plot.state.weeds]),
    ];

    if (plant) {
        const age = Math.floor((Date.now() - plant.plantedAt) / 1000);
        lines.push(
            "",
            row("Cây:", LABEL.crop[plant.cropType]),
            row("Giai đoạn:", LABEL.growth[plant.state.growth]),
            row("Tình trạng:", LABEL.condition[plant.state.condition]),
            row("Sâu bệnh:", plant.state.hasPest ? "Có sâu bọ" : "Không"),
            row("Tuổi:", `${age}s`)
        );
    } else {
        lines.push("", "Chưa có cây");
    }

    overlay.textContent = lines.join("\n");
    overlay.style.display = "block";
};

// ---------- Inventory ----------
const ITEM_LABEL: Record<ItemType, string> = {
    POTATO_SEED: "Mầm khoai tây",
    TOMATO_SEED: "Hạt cà chua",
    POTATO: "Khoai tây",
    TOMATO: "Cà chua",
    GRASS: "Cỏ",
    BUG: "Bọ",
};

let inventoryOpen = false;

const inventoryPanel = document.createElement("div");
inventoryPanel.style.cssText =
    "position:fixed;top:8px;right:8px;padding:8px 10px;min-width:180px;" +
    "background:#000c;color:#fff;font:12px monospace;border-radius:4px;" +
    "pointer-events:none;display:none";
document.body.appendChild(inventoryPanel);

addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "i" && !e.repeat) inventoryOpen = !inventoryOpen;
});

const ICON_SIZE = 32;

const makeInventoryRow = (type: ItemType, qty: number): HTMLElement => {
    const rowEl = document.createElement("div");
    rowEl.style.cssText = "display:flex;align-items:center;gap:8px;margin-top:4px";

    const icon = document.createElement("img");
    icon.src = itemImageUrl(type);
    icon.alt = ITEM_LABEL[type];
    icon.style.cssText = `width:${ICON_SIZE}px;height:${ICON_SIZE}px;object-fit:contain`;

    const name = document.createElement("span");
    name.textContent = ITEM_LABEL[type];
    name.style.flex = "1";

    const count = document.createElement("span");
    count.textContent = `x${qty}`;

    rowEl.append(icon, name, count);
    return rowEl;
};

// Chi dung lai DOM khi kho do thay doi de anh khong bi nhap nhay moi khung hinh.
let inventoryKey = "";

const renderInventory = (): void => {
    if (!inventoryOpen) {
        inventoryPanel.style.display = "none";
        inventoryKey = "";
        return;
    }

    const inventory = playerId !== null ? state?.inventory.get(playerId) : undefined;
    const items = inventory ? [...inventory].filter(([, qty]) => qty > 0) : [];
    const key = items.map(([type, qty]) => `${type}:${qty}`).join("|");

    if (inventoryPanel.style.display === "block" && key === inventoryKey) return;
    inventoryKey = key;

    const title = document.createElement("div");
    title.textContent = "Kho đồ";
    title.style.fontWeight = "bold";

    inventoryPanel.replaceChildren(
        title,
        ...(items.length
            ? items.map(([type, qty]) => makeInventoryRow(type, qty))
            : [Object.assign(document.createElement("div"), { textContent: "Trống" })])
    );
    inventoryPanel.style.display = "block";
};

// ---------- Game loop ----------
let last = performance.now();
let lastSent = 0;

const loop = (now: number): void => {
    const dt = (now - last) / 1000;
    last = now;

    if (me) {
        const axis = getMoveAxis(keys);
        // Canvas co truc y huong xuong nen dao dau y
        const moved = move(me, { x: axis.x, y: -axis.y }, dt);
        moved.x = Math.min(Math.max(moved.x, 0), canvas.width);
        moved.y = Math.min(Math.max(moved.y, 0), canvas.height);
        me = moved;

        if (now - lastSent >= MOVE_SEND_MS) {
            sendMove();
            lastSent = now;
        }
    }

    render();
    renderOverlay();
    renderInventory();
    requestAnimationFrame(loop);
};
requestAnimationFrame(loop);
