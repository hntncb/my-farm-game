import Fastify from "fastify";
import websocket from "@fastify/websocket";
import type { ServerMsg } from "../shared/protocol.js";
import type { Repository } from "./db/repository.js";
import { parseClientMsg } from "./handlers.js";
import type { Session } from "./session.js";
import { WorldManager } from "./world-manager.js";

const MAX_PAYLOAD = 1024;

export const buildApp = async (repo: Repository) => {
    const app = Fastify({ logger: true });
    await app.register(websocket, { options: { maxPayload: MAX_PAYLOAD } });

    const manager = new WorldManager(repo, app.log);

    app.get("/health", async () => ({ ok: true }));

    app.get("/ws", { websocket: true }, (socket) => {
        let session: Session | null = null;

        // Xu ly tuan tu moi tin nhan cua mot ket noi (join co await nen can giu thu tu).
        let queue: Promise<void> = Promise.resolve();
        const enqueue = (job: () => Promise<void> | void): void => {
            queue = queue.then(job).catch((err) => app.log.error(err));
        };

        const sendError = (message: string): void => {
            const msg: ServerMsg = { t: "error", message };
            if (socket.readyState === 1) socket.send(JSON.stringify(msg));
        };

        socket.on("message", (raw) => {
            const text = raw.toString();
            enqueue(async () => {
                const msg = parseClientMsg(text);
                if (!msg) return sendError("tin nhan khong hop le");

                if (msg.t === "hello") {
                    if (session) return;
                    try {
                        session = await manager.join(msg.token, socket);
                    } catch (err) {
                        sendError((err as Error).message);
                        socket.close(4001, "dang nhap that bai");
                    }
                    return;
                }

                if (!session) return sendError("chua dang nhap");
                manager.handle(session, msg);
            });
        });

        socket.on("close", () => {
            enqueue(async () => {
                if (session) await manager.leave(session);
            });
        });
    });

    return { app, manager };
};
