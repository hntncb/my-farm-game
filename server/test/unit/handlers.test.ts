import { describe, expect, it } from "vitest";
import type { ServerMsg } from "../../../shared/protocol.js";
import { createWorld } from "../../core/world-factory.js";
import { handleAct, handleMove, newMoveBudget, parseClientMsg } from "../../handlers.js";
import { deserializeWorld, serializeWorld } from "../../persistence.js";
import { dispatchScheduledEvent } from "../../scheduler/dispatcher.js";
import type { Session } from "../../session.js";
import { MemoryRepository } from "../../db/repository.js";
import { WorldManager } from "../../world-manager.js";

const makeSession = (playerId = 1) => {
    const sent: ServerMsg[] = [];
    const world = createWorld(playerId);
    const session: Session = {
        playerId,
        world,
        socket: {
            readyState: 1,
            send: (data: string) => { sent.push(JSON.parse(data) as ServerMsg); },
            close: () => {},
        },
        lastMoveAt: 0,
        moveBudget: newMoveBudget(world.players.get(playerId)!.speed),
        dirty: false,
    };
    return { session, sent };
};

const standOn = (session: Session, plotId: number): void => {
    const plot = session.world.plots.get(plotId)!;
    const player = session.world.players.get(session.playerId)!;
    player.x = plot.x;
    player.y = plot.y;
};

describe("parseClientMsg", () => {
    it("chap nhan tin nhan hop le", () => {
        expect(parseClientMsg('{"t":"move","x":1,"y":2}')).toEqual({ t: "move", x: 1, y: 2 });
        expect(parseClientMsg('{"t":"act","kind":"plant","plotId":1,"cropType":"TOMATO"}'))
            .toEqual({ t: "act", kind: "plant", plotId: 1, cropType: "TOMATO" });
    });

    it("tu choi tin nhan sai", () => {
        expect(parseClientMsg("khong phai json")).toBeNull();
        expect(parseClientMsg('{"t":"act","kind":"hack","plotId":1}')).toBeNull();
        expect(parseClientMsg('{"t":"act","kind":"plant","plotId":1,"cropType":"GOLD"}')).toBeNull();
        expect(parseClientMsg('{"t":"move","x":"1","y":2}')).toBeNull();
    });
});

describe("handleAct", () => {
    it("cuoc, tuoi, trong cay va tru hat giong", () => {
        const { session } = makeSession();
        standOn(session, 1);

        handleAct(session, { t: "act", kind: "till", plotId: 1 });
        handleAct(session, { t: "act", kind: "water", plotId: 1 });
        handleAct(session, { t: "act", kind: "plant", plotId: 1, cropType: "POTATO" });

        const plot = session.world.plots.get(1)!;
        expect(plot.plantId).toBe(1);
        expect(session.world.plants.size).toBe(1);
        expect(session.world.inventory.get(1)!.get("POTATO_SEED")).toBe(4);
        expect(session.world.nextPlantId).toBe(2);
        expect(session.dirty).toBe(true);
    });

    it("bao loi khi dung qua xa o dat", () => {
        const { session } = makeSession();
        expect(() => handleAct(session, { t: "act", kind: "till", plotId: 1 }))
            .toThrow("khoang cach qua xa");
    });

    it("bao loi khi thu hoach o khong co cay", () => {
        const { session } = makeSession();
        standOn(session, 1);
        expect(() => handleAct(session, { t: "act", kind: "harvest", plotId: 1 }))
            .toThrow("khong co cay");
    });

    it("bao loi khi trong cay ma thieu loai cay", () => {
        const { session } = makeSession();
        standOn(session, 1);
        handleAct(session, { t: "act", kind: "till", plotId: 1 });
        handleAct(session, { t: "act", kind: "water", plotId: 1 });
        expect(() => handleAct(session, { t: "act", kind: "plant", plotId: 1 }))
            .toThrow("thieu loai cay");
    });
});

describe("handleMove", () => {
    it("chap nhan buoc di nho", () => {
        const { session, sent } = makeSession();
        const player = session.world.players.get(1)!;
        handleMove(session, { t: "move", x: player.x + 10, y: player.y }, 100);
        expect(player.x).toBe(42);
        expect(sent).toHaveLength(0);
    });

    it("tu choi dich chuyen tuc thoi va keo client ve", () => {
        const { session, sent } = makeSession();
        const player = session.world.players.get(1)!;
        const before = { x: player.x, y: player.y };
        handleMove(session, { t: "move", x: 300, y: 300 }, 100);
        expect({ x: player.x, y: player.y }).toEqual(before);
        expect(sent).toEqual([{ t: "teleport", ...before }]);
    });

    it("khong cho spam tin nhan de di nhanh hon toc do", () => {
        const { session } = makeSession();
        const player = session.world.players.get(1)!;
        for (let i = 0; i < 200; i++) {
            handleMove(session, { t: "move", x: player.x + 15, y: player.y }, 1000);
        }
        expect(player.x).toBeLessThan(32 + 200 * 0.5 * 1.25 + 1);
    });

    it("tu choi toa do ngoai ban do hoac khong hop le", () => {
        const { session, sent } = makeSession();
        handleMove(session, { t: "move", x: -5, y: 10 }, 100);
        handleMove(session, { t: "move", x: Number.NaN, y: 10 }, 200);
        expect(sent).toHaveLength(2);
    });
});

describe("persistence", () => {
    it("luu va nap lai world cung hang doi su kien", () => {
        const { session } = makeSession();
        standOn(session, 1);
        handleAct(session, { t: "act", kind: "till", plotId: 1 });
        handleAct(session, { t: "act", kind: "water", plotId: 1 });
        handleAct(session, { t: "act", kind: "plant", plotId: 1, cropType: "POTATO" });

        const restored = deserializeWorld(JSON.parse(JSON.stringify(serializeWorld(session.world))));

        expect(restored.nextPlantId).toBe(2);
        expect(restored.plants.get(1)?.cropType).toBe("POTATO");
        expect(restored.inventory.get(1)!.get("POTATO_SEED")).toBe(4);
        expect(restored.scheduler.snapshot()).toEqual(session.world.scheduler.snapshot());
    });

    it("luu khi roi di, nap lai khi vao lai va cay lon len sau khi bu thoi gian offline", async () => {
        const repo = new MemoryRepository();
        const manager = new WorldManager(repo, { error: () => {} });
        const token = "123e4567-e89b-42d3-a456-426614174000";
        const socket = { readyState: 1, send: () => {}, close: () => {} };

        const first = await manager.join(token, socket);
        standOn(first, 1);
        handleAct(first, { t: "act", kind: "till", plotId: 1 });
        handleAct(first, { t: "act", kind: "water", plotId: 1 });
        handleAct(first, { t: "act", kind: "plant", plotId: 1, cropType: "POTATO" });
        await manager.leave(first);

        const second = await manager.join(token, socket);
        expect(second.world).not.toBe(first.world);
        expect(second.world.plants.get(1)?.cropType).toBe("POTATO");

        manager.tick(Date.now() + 10 * 60_000);
        expect(second.world.plants.get(1)?.state.growth).toBe("MATURE");
    });
});
