import { itemImageUrl } from "./images.js";
import type { ItemType } from "../../shared/entities/inventory.js";
import { ITEM_LABEL } from "./inventory.js";
import { SHOP_CONFIG } from "../../shared/config/shop-config.js";
import { sendShop } from "./network.js";
import { game } from "./store.js";

export const makeShopCell = (type: ItemType, stonk: number, price: number, onPick: () => void): HTMLElement => {
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
    count.textContent = `x${stonk}`;

    const itemPrice = document.createElement("span");
    itemPrice.textContent = `Giá mua: ${price}`;
    
    cell.append(icon, name, count, itemPrice);
    cell.onclick = onPick;
    return cell;
};

const panel = document.createElement("div");    
panel.className = "hud-panel hud-bottom-right interactive";
document.body.appendChild(panel);

export const renderShopCell = (): void => {
    const { state, playerId } = game;
    // Lấy map shop của player hiện tại từ state, nếu chưa có thì fallback về SHOP_CONFIG ban đầu
    const playerShop = playerId !== null ? state?.shop.get(playerId) : undefined;

    const cells = Object.entries(SHOP_CONFIG).map(([itemType, itemInfo]) => {
        const type = itemType as ItemType;
        // Ưu tiên lấy số lượng tồn kho theo state thực tế từ server, nếu không có thì lấy mặc định trong config
        const stonk = playerShop?.get(type) ?? itemInfo.availableStonk;

        return makeShopCell(type, stonk, itemInfo.price.sellForPlayer, () => {
            sendShop("buy", type, 1);
            console.log(type, "+1");
        });
    });

    panel.replaceChildren(...cells);
};