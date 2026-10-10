import pg from "pg";
import type { StoredWorld } from "../persistence.js";

export interface Repository {
    getOrCreatePlayerId(token: string): Promise<number>;
    loadWorld(playerId: number): Promise<StoredWorld | null>;
    saveWorld(playerId: number, stored: StoredWorld): Promise<void>;
    close(): Promise<void>;
}

// ---------- In-memory (dung khi khong co DATABASE_URL) ----------
export class MemoryRepository implements Repository {
    private tokens = new Map<string, number>();
    private worlds = new Map<number, string>();
    private nextId = 1;

    async getOrCreatePlayerId(token: string): Promise<number> {
        let id = this.tokens.get(token);
        if (id === undefined) {
            id = this.nextId++;
            this.tokens.set(token, id);
        }
        return id;
    }

    async loadWorld(playerId: number): Promise<StoredWorld | null> {
        const raw = this.worlds.get(playerId);
        return raw === undefined ? null : (JSON.parse(raw) as StoredWorld);
    }

    async saveWorld(playerId: number, stored: StoredWorld): Promise<void> {
        this.worlds.set(playerId, JSON.stringify(stored));
    }

    async close(): Promise<void> {}
}

// ---------- Postgres ----------
const SCHEMA = `
create table if not exists players (
    id serial primary key,
    guest_token uuid unique not null
);
create table if not exists worlds (
    player_id int primary key references players(id) on delete cascade,
    state jsonb not null,
    updated_at timestamptz not null default now()
);
`;

export class PgRepository implements Repository {
    private constructor(private readonly pool: pg.Pool) {}

    static async connect(connectionString: string): Promise<PgRepository> {
        const pool = new pg.Pool({ connectionString });
        await pool.query(SCHEMA);
        return new PgRepository(pool);
    }

    async getOrCreatePlayerId(token: string): Promise<number> {
        const res = await this.pool.query<{ id: number }>(
            `insert into players (guest_token) values ($1)
             on conflict (guest_token) do update set guest_token = excluded.guest_token
             returning id`,
            [token]
        );
        const row = res.rows[0];
        if (!row) throw new Error("khong tao duoc player");
        return row.id;
    }

    async loadWorld(playerId: number): Promise<StoredWorld | null> {
        const res = await this.pool.query<{ state: StoredWorld }>(
            "select state from worlds where player_id = $1",
            [playerId]
        );
        return res.rows[0]?.state ?? null;
    }

    async saveWorld(playerId: number, stored: StoredWorld): Promise<void> {
        await this.pool.query(
            `insert into worlds (player_id, state) values ($1, $2)
             on conflict (player_id) do update set state = excluded.state, updated_at = now()`,
            [playerId, JSON.stringify(stored)]
        );
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}

export const createRepository = async (databaseUrl: string | undefined): Promise<Repository> =>
    databaseUrl ? PgRepository.connect(databaseUrl) : new MemoryRepository();
