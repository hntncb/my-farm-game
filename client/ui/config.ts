export const WS_URL: string =
    import.meta.env.VITE_WS_URL ??
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
export const TOKEN_KEY = "farm-token";
export const MOVE_SEND_MS = 100;

export const COLOR = {
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
