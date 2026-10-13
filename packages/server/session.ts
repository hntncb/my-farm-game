import type { ServerMsg } from "../shared/protocol.js";
import { toSnapshot } from "../shared/snapshot.js";
import type { World } from "./core/world.js";

// Phan toi thieu cua WebSocket ma server can dung.
export interface ClientSocket {
    readonly readyState: number;
    send(data: string): void;
    close(code?: number, reason?: string): void;
}

const WS_OPEN = 1;

export type Session = {
    playerId: number;
    world: World;
    socket: ClientSocket;
    lastMoveAt: number;
    moveBudget: number;
    dirty: boolean;
};

export const sendMsg = (session: Session, msg: ServerMsg): void => {
    if (session.socket.readyState === WS_OPEN) {
        session.socket.send(JSON.stringify(msg));
    }
};

export const sendState = (session: Session): void => {
    sendMsg(session, { t: "state", state: toSnapshot(session.world) });
};
