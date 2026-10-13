import type { ItemType } from "../../shared/entities/inventory.js";
import type { ClientMsg, ServerMsg } from "../../shared/protocol.js";
import { fromSnapshot } from "../../shared/snapshot.js";
import { TOKEN_KEY, WS_URL } from "./config.js";
import { game, showMessage } from "./store.js";

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

// ---------- Ket noi ----------
let ws: WebSocket | null = null;
let sentX = NaN;
let sentY = NaN;

export const send = (msg: ClientMsg): void => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
};

export const sendMove = (): void => {
    const me = game.me;
    if (!me || (me.x === sentX && me.y === sentY)) return;
    sentX = me.x;
    sentY = me.y;
    send({ t: "move", x: me.x, y: me.y });
};

export const sendShop = (action: "buy" | "sell", itemType: ItemType, quantity: number): void => {
    send({ t: "shop", action, itemType, quantity });
};

export const connect = (): void => {
    const socket = new WebSocket(WS_URL);
    ws = socket;

    socket.onopen = () => send({ t: "hello", token: getToken() });

    socket.onmessage = (e) => {
        const msg = JSON.parse(e.data as string) as ServerMsg;
        switch (msg.t) {
            case "welcome":
                game.playerId = msg.playerId;
                break;
            case "state": {
                game.state = fromSnapshot(msg.state);
                (window as any).__WORLD_STATE__ = game.state;
                (window as any).__RAW_SNAPSHOT__ = msg.state;
                // Chi lay vi tri tu server o lan dau; sau do client tu tinh.
                if (!game.me && game.playerId !== null) {
                    const p = game.state.players.get(game.playerId);
                    if (p) game.me = { ...p };
                }
                break;
            }
            case "teleport":
                if (game.me) game.me = { ...game.me, x: msg.x, y: msg.y };
                break;
            case "error":
                showMessage(msg.message);
                break;
        }
    };

    socket.onclose = () => {
        if (ws !== socket) return;
        game.state = null;
        game.me = null;
        game.playerId = null;
        sentX = NaN;
        sentY = NaN;
        showMessage("mat ket noi, dang thu lai...");
        setTimeout(connect, 1000);
    };
};
