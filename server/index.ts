import { buildApp } from "./app.js";
import { createRepository } from "./db/repository.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";

const repo = await createRepository(process.env.DATABASE_URL);
const { app, manager } = await buildApp(repo);

if (!process.env.DATABASE_URL) {
    app.log.warn("Khong co DATABASE_URL: du lieu chi luu trong bo nho, se mat khi tat server");
}

manager.start();
await app.listen({ port: PORT, host: HOST });

let shuttingDown = false;
const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info(`nhan ${signal}, dang luu va tat server`);

    manager.stop();
    await manager.saveAll();
    await app.close();
    await repo.close();
    process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));