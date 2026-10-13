import type { CurrencyType } from "../../shared/entities/currency.js";
import { game } from "./store.js";

const CURRENCY_TYPES: CurrencyType[] = ["COIN", "GOLD"];

const CURRENCY_LABEL: Record<CurrencyType, string> = {
    COIN: "🟡",
    GOLD: "🧈",
};

export const makeCurrencyCell = (type: CurrencyType, amount: number, onPick: () => void): HTMLElement => {
    const cell = document.createElement("button");
    cell.className = "inv-row seed-btn";

    const name = document.createElement("span");
    name.textContent = CURRENCY_LABEL[type];
    name.className = "inv-name";

    const amountEl = document.createElement("span");
    amountEl.textContent = `x${amount}`;
    
    cell.append(name, amountEl);
    cell.onclick = onPick;
    return cell;
};

const panel = document.createElement("div");    
panel.className = "hud-panel top-center interactive";
document.body.appendChild(panel);

export const renderCurrency = (): void => {
    const { state, playerId } = game;
    const playerCurrency = playerId !== null ? state?.currency.get(playerId) : undefined;

    const cells = CURRENCY_TYPES.map((type) => {
        const stonk = playerCurrency?.get(type) ?? 0;

        return makeCurrencyCell(type, stonk, () => {
            console.log("Bạn đã chọn loại tiền:", type, "với số lượng:", stonk);
        });
    });

    panel.replaceChildren(...cells);
};