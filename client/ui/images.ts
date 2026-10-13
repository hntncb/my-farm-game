import type { CropType, GrowthState } from "../../shared/entities/crop.js";
import type { ItemType } from "../../shared/entities/inventory.js";
import type { Condition } from "../../shared/entities/plant.js";
import type { Moisture } from "../../shared/entities/plot.js";

// Vite liet ke san moi file png trong assets/ luc build / luc chay dev.
// Them hoac xoa file png thi danh sach nay tu cap nhat, khong can sua code.
const FILES = import.meta.glob<string>("/assets/**/*.png", {
    eager: true,
    query: "?url",
    import: "default",
});

const FALLBACK_PATH = "/assets/no-image.png";

// Dung Record<..., 1> + satisfies de TypeScript bao loi neu them loai moi
// vao CropType / GrowthState / ItemType ma quen khai bao o day.
export const CROP_TYPES = Object.keys({
    POTATO: 1,
    TOMATO: 1,
} satisfies Record<CropType, 1>) as CropType[];

export const GROWTH_STATES = Object.keys({
    SEEDED: 1,
    SPROUT: 1,
    GROWING: 1,
    MATURE: 1,
} satisfies Record<GrowthState, 1>) as GrowthState[];

export const ITEM_TYPES = Object.keys({
    POTATO_SEED: 1,
    TOMATO_SEED: 1,
    POTATO: 1,
    TOMATO: 1,
    GRASS: 1,
    BUG: 1,
} satisfies Record<ItemType, 1>) as ItemType[];

export const MOISTURE = Object.keys({
    DRY: 1,
    WET: 1,
} satisfies Record<Moisture, 1>) as Moisture[];

export const EFFECT_TYPES = ["WEED","PEST"] as const;

export type EffectType = (typeof EFFECT_TYPES)[number];


// ---------- Quy uoc duong dan ----------
export const AVATAR_PATH = "/assets/player/player1.png";

export const playerAvatarImage = (): HTMLImageElement | null => {
    const url = FILES[AVATAR_PATH];
    return url ? loadImage(url) : null;
};
export const effectImagePath = (effect: EffectType): string =>
    `/assets/effect/${effect}.png`;

export const plantImagePath = (crop: CropType, growth: GrowthState): string =>
    `/assets/crops/${crop}/${growth}.png`;

export const itemImagePath = (item: ItemType): string =>
    `/assets/items/${item}.png`;

export const plotMoistureImagePath = (moisture: Moisture): string =>
    `/assets/moisture/${moisture}.png`;

export const plantConditionImagePath = (crop: CropType, condition: Condition): string =>
    `/assets/conditions/${condition}.png`;
// ---------- Tra ve URL, thieu anh thi dung no-image.png ----------
const fallbackUrl = FILES[FALLBACK_PATH] ?? "";

const urlOf = (path: string): string => FILES[path] ?? fallbackUrl;

export const plantImageUrl = (crop: CropType, growth: GrowthState): string =>
    urlOf(plantImagePath(crop, growth));

export const plantConditionImageUrl = (crop: CropType, condition: Condition): string =>
    urlOf(plantConditionImagePath(crop, condition));

export const itemImageUrl = (item: ItemType): string =>
    urlOf(itemImagePath(item));

// ---------- Anh dung cho canvas ----------
const cache = new Map<string, HTMLImageElement>();

const loadImage = (url: string): HTMLImageElement => {
    const cached = cache.get(url);
    if (cached) return cached;

    const img = new Image();
    // File hong hoac khong doc duoc thi cung dung no-image.png
    img.onerror = () => {
        img.onerror = null;
        if (fallbackUrl && img.src !== fallbackUrl) img.src = fallbackUrl;
    };
    img.src = url;
    cache.set(url, img);
    return img;
};

export const plantImage = (crop: CropType, growth: GrowthState): HTMLImageElement =>
    loadImage(plantImageUrl(crop, growth));

export const plantConditionImage = (crop: CropType, condition: Condition): HTMLImageElement =>
    loadImage(plantConditionImageUrl(crop, condition));

export const effectImage = (effect: EffectType):HTMLImageElement =>
    loadImage(urlOf(effectImagePath(effect)));

export const moistureImage = (moisture: Moisture):HTMLImageElement =>
    loadImage(urlOf(plotMoistureImagePath(moisture)));


export const isReady = (img: HTMLImageElement): boolean =>
    img.complete && img.naturalWidth > 0;

// Tai san tat ca anh de khong bi cham khi can ve lan dau.
export const preloadImages = (): void => {
    if (fallbackUrl) loadImage(fallbackUrl);
    for (const crop of CROP_TYPES) {
        for (const growth of GROWTH_STATES) plantImage(crop, growth);
    }
    for (const item of ITEM_TYPES) loadImage(itemImageUrl(item));
    for (const effect of EFFECT_TYPES) effectImage(effect);
    for (const moisture of MOISTURE) (moistureImage(moisture));
};

// Danh sach anh chua co (de nhac khi dev).
export const missingImages = (): string[] => {
    const paths: string[] = [];
    for (const crop of CROP_TYPES) {
        for (const growth of GROWTH_STATES) paths.push(plantImagePath(crop, growth));
    }
    for (const item of ITEM_TYPES) paths.push(itemImagePath(item));
    for (const effect of EFFECT_TYPES) paths.push(effectImagePath(effect));
    for (const moisture of MOISTURE) paths.push(plotMoistureImagePath(moisture));
    return paths.filter((p) => FILES[p] === undefined);
};

if (import.meta.env.DEV) {
    if (!fallbackUrl) {
        console.warn(`Khong tim thay ${FALLBACK_PATH}, anh thieu se khong hien gi ca.`);
    }
    const missing = missingImages();
    if (missing.length > 0) {
        console.info(`Chua co ${missing.length} anh (dang dung no-image.png):\n` + missing.join("\n"));
    }
}
