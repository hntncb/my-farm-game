import type { ItemType } from "../../shared/entities/inventory.js";
import { itemImageUrl } from "./images.js";;
import { game } from "./store.js";

export const ITEM_LABEL: Record<ItemType, string> = {
    POTATO_SEED: "Mầm khoai tây",
    TOMATO_SEED: "Hạt cà chua",
    POTATO: "Khoai tây",
    TOMATO: "Cà chua",
    GRASS: "Cỏ",
    BUG: "Bọ",
};

let inventoryOpen = false;

const inventoryPanel = document.createElement("div");
inventoryPanel.className = "hud-panel hud-right hidden";
document.body.appendChild(inventoryPanel);

addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "i" && !e.repeat) inventoryOpen = !inventoryOpen;
});

const makeInventoryRow = (type: ItemType, qty: number): HTMLElement => {
    const rowEl = document.createElement("div");
    rowEl.className = "inv-row";

    const icon = document.createElement("img");
    icon.src = itemImageUrl(type);
    icon.alt = ITEM_LABEL[type];
    icon.className = "inv-icon";

    const name = document.createElement("span");
    name.textContent = ITEM_LABEL[type];
    name.className = "inv-name";

    const count = document.createElement("span");
    count.textContent = `x${qty}`;

    rowEl.append(icon, name, count);
    return rowEl;
};

// Chi dung lai DOM khi kho do thay doi de anh khong bi nhap nhay moi khung hinh.
let inventoryKey = "";

export const renderInventory = (): void => {
    if (!inventoryOpen) {
        inventoryPanel.classList.add("hidden");
        inventoryKey = "";
        return;
    }

    const { state, playerId } = game;
    const inventory = playerId !== null ? state?.inventory.get(playerId) : undefined;
    const items = inventory ? [...inventory].filter(([, qty]) => qty > 0) : [];
    const key = items.map(([type, qty]) => `${type}:${qty}`).join("|");

    if (!inventoryPanel.classList.contains("hidden") && key === inventoryKey) return;
    inventoryKey = key;

    const title = document.createElement("div");
    title.textContent = "Kho đồ";
    title.className = "inv-title";
    
    inventoryPanel.replaceChildren(
        title,
        ...(items.length
            ? items.map(([type, qty]) => makeInventoryRow(type, qty))
            : [Object.assign(document.createElement("div"), { textContent: "Trống" })])
    );
    inventoryPanel.classList.remove("hidden");
};

export const findItems = (keyword = ""): [ItemType, number][] => {
    const { state, playerId } = game;
    const inventory = playerId !== null ? state?.inventory.get(playerId) : undefined;
    if (!inventory) return [];

    const kw = keyword.trim().toLowerCase();
    return [...inventory].filter(
        ([type, qty]) => qty > 0 && type.toLowerCase().includes(kw)
    );
};