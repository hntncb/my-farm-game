import type { WorldState } from "../../shared/state.js";
import type { Player } from "../../shared/entities/player.js";

// Trang thai dung chung giua cac module.
// Dung object de cac module khac gan lai duoc (import `let` thi chi doc).
export const game: {
    state: WorldState | null; // snapshot moi nhat tu server
    playerId: number | null;
    me: Player | null;        // vi tri do client tu tinh
    message: string;
} = {
    state: null,
    playerId: null,
    me: null,
    message: "",
};

export const showMessage = (text: string): void => {
    game.message = text;
    setTimeout(() => {
        if (game.message === text) game.message = "";
    }, 2000);
};
