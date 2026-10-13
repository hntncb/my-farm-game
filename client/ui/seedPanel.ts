import type { CropType } from "../../shared/entities/crop.js";
import type { ItemType } from "../../shared/entities/inventory.js";
import { itemImageUrl } from "./images.js";
import { findItems, ITEM_LABEL } from "./inventory.js";

export const makeSeedCell = (type: ItemType, qty: number, onPick: () => void): HTMLElement => {
    const cell = document.createElement("button");
    cell.className = "inv-row seed-btn";

    const icon = document.createElement("img");
    icon.src = itemImageUrl(type);
    icon.alt = ITEM_LABEL[type];
    icon.className = "inv-icon";

    const name = document.createElement("span");
    name.textContent = ITEM_LABEL[type];
    name.className = "inv-name";

    const count = document.createElement("span");
    count.textContent = `x${qty}`;

    cell.append(icon, name, count);
    cell.onclick = onPick;
    return cell;
};

const panel = document.createElement("div");    
panel.className = "hud-panel hud-bottom-center interactive";
document.body.appendChild(panel);

let seedSeleted: CropType | null = null;
let seedKey = "";

export const renderSeedCell = (): void => {
    const seeds = findItems("_seed");
    const key = seeds.map(([type, qty]) => `${type}:${qty}`).join("|");

    // Neu danh sach va so luong hat giong khong doi thi khong tao lai DOM tranh mat su kien click
    if (key === seedKey) return;
    seedKey = key;

    const cells = seeds.map(([keyType, qty]) => {
        const crop = keyType.replace(/_SEED$/, "") as CropType;

        return makeSeedCell(keyType, qty, () => {
            seedSeleted = crop;
            console.log("Bạn đã chọn", seedSeleted);
        });
    });

    panel.replaceChildren(...cells);
};

export const getSeedSeleted = (): CropType | null => {
    return seedSeleted;
};