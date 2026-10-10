import type { ClientMsg } from "../shared/protocol.js";
import { createWorld } from "./core/world-factory.js";
import type { World } from "./core/world.js";
import type { Repository } from "./db/repository.js";
import { handleAct, handleMove, newMoveBudget } from "./handlers.js";
import { deserializeWorld, serializeWorld } from "./persistence.js";
import { dispatchScheduledEvent } from "./scheduler/dispatcher.js";
import { sendMsg, sendState, type ClientSocket, type Session } from "./session.js";

export interface Logger {
    error(obj: unknown, msg?: string): void;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TICK_MS = 100;
const AUTOSAVE_MS = 30_000;
// Gioi han so su kien xu ly moi tick de tranh treo server khi bu thoi gian offline qua dai.
const MAX_EVENTS_PER_TICK = 5_000;

export class WorldManager {
    private sessions = new Map<number, Session>();
    private tickTimer: NodeJS.Timeout | null = null;
    private saveTimer: NodeJS.Timeout | null = null;
    private stopped = false;

    constructor(
        private readonly repo: Repository,
        private readonly log: Logger,
    ) {}

    // ---------- Vong doi ----------
    start(): void {
        this.tickTimer = setInterval(() => this.tick(Date.now()), TICK_MS);
        this.saveTimer = setInterval(() => void this.saveDirty(), AUTOSAVE_MS);
    }

    stop(): void {
        this.stopped = true;
        if (this.tickTimer) clearInterval(this.tickTimer);
        if (this.saveTimer) clearInterval(this.saveTimer);
        this.tickTimer = null;
        this.saveTimer = null;
    }

    // ---------- Ket noi ----------
    async join(token: string, socket: ClientSocket): Promise<Session> {
        if (!UUID_RE.test(token)) throw new Error("token khong hop le");

        const playerId = await this.repo.getOrCreatePlayerId(token);
        const stored = this.sessions.has(playerId) ? null : await this.repo.loadWorld(playerId);

        // Kiem tra lai sau cac lenh await: neu co phien khac vua vao thi dung lai world cua no.
        const existing = this.sessions.get(playerId);
        let world: World;
        if (existing) {
            world = existing.world;
            existing.socket.close(4000, "dang nhap o noi khac");
        } else {
            world = stored ? deserializeWorld(stored) : createWorld(playerId);
        }

        const player = world.players.get(playerId);
        const session: Session = {
            playerId,
            world,
            socket,
            lastMoveAt: Date.now(),
            moveBudget: newMoveBudget(player?.speed ?? 0),
            dirty: !stored && !existing,
        };
        this.sessions.set(playerId, session);

        sendMsg(session, { t: "welcome", playerId });
        sendState(session);
        return session;
    }

    async leave(session: Session): Promise<void> {
        // Phien da bi thay the boi ket noi moi thi bo qua.
        if (this.sessions.get(session.playerId) !== session) return;
        this.sessions.delete(session.playerId);
        if (!this.stopped) await this.save(session);
    }

    handle(session: Session, msg: ClientMsg): void {
        switch (msg.t) {
            case "move":
                handleMove(session, msg);
                return;
            case "act":
                try {
                    handleAct(session, msg);
                } catch (err) {
                    sendMsg(session, { t: "error", message: (err as Error).message });
                }
                return;
            case "hello":
                return;
        }
    }

    // ---------- Game loop ----------
    tick(now: number): void {
        for (const session of this.sessions.values()) {
            let processed = 0;

            // Lap lai den khi het su kien den han: cac su kien tu lap lich (co, sau, lon len)
            // se duoc xu ly bu lien tiep sau khi world duoc nap lai tu database.
            for (
                let due = session.world.scheduler.popDue(now);
                due.length > 0 && processed < MAX_EVENTS_PER_TICK;
                due = session.world.scheduler.popDue(now)
            ) {
                for (const event of due) {
                    try {
                        dispatchScheduledEvent(event, session.world);
                    } catch (err) {
                        this.log.error(err, "loi khi xu ly su kien");
                    }
                }
                processed += due.length;
            }

            if (processed > 0) {
                session.dirty = true;
                sendState(session);
            }
        }
    }

    // ---------- Luu tru ----------
    private async save(session: Session): Promise<void> {
        // Serialize dong bo truoc khi await de khong bi world thay doi giua chung.
        const stored = serializeWorld(session.world);
        session.dirty = false;
        try {
            await this.repo.saveWorld(session.playerId, stored);
        } catch (err) {
            session.dirty = true;
            this.log.error(err, "khong luu duoc world");
        }
    }

    async saveDirty(): Promise<void> {
        const dirty = [...this.sessions.values()].filter((s) => s.dirty);
        await Promise.all(dirty.map((s) => this.save(s)));
    }

    async saveAll(): Promise<void> {
        await Promise.all([...this.sessions.values()].map((s) => this.save(s)));
    }
}
