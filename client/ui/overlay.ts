import { CELL } from "../../shared/constants.js";
import { canvas, isoToWorld } from "./canvas.js";
import { game } from "./store.js";

let hoveredPlotId: number | null = null;

const overlay = document.createElement("pre");
overlay.className = "hud-panel hud-left hidden";
document.body.appendChild(overlay);

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const sy = (e.clientY - rect.top) * (canvas.height / rect.height);
    const { x: mx, y: my } = isoToWorld(sx, sy);

    hoveredPlotId = null;
    for (const plot of game.state?.plots.values() ?? []) {
        if (Math.abs(mx - plot.x) <= CELL / 2 && Math.abs(my - plot.y) <= CELL / 2) {
            hoveredPlotId = plot.id;
            break;
        }
    }
});

canvas.addEventListener("mouseleave", () => {
    hoveredPlotId = null;
});

const LABEL = {
    soil: { UNTILLNED: "Chưa cuốc", TILLNED: "Đã cuốc", HARVESTED: "Đã thu hoạch" },
    moisture: { DRY: "Khô", WET: "Ẩm" },
    weeds: { CLEAN: "Sạch", WEEDY: "Có cỏ" },
    crop: { POTATO: "Khoai tây", TOMATO: "Cà chua" },
    growth: { SEEDED: "Hạt giống", SPROUT: "Nảy mầm", GROWING: "Đang lớn", MATURE: "Chín" },
    condition: { ACTIVE: "Phát triển", WITHERED: "Héo", ROTEN: "Thối" },
} as const;

const row = (label: string, value: string): string => `${label.padEnd(11)}${value}`;

export const renderOverlay = (): void => {
    const state = game.state;
    const plot = hoveredPlotId !== null ? state?.plots.get(hoveredPlotId) : undefined;
    if (!plot) {
        overlay.classList.add("hidden");
        return;
    }
    const plant = plot.plantId !== null ? state?.plants.get(plot.plantId) : undefined;

    const lines = [
        `Ô đất #${plot.id}`,
        row("Đất:", LABEL.soil[plot.state.soil]),
        row("Độ ẩm:", LABEL.moisture[plot.state.moisture]),
        row("Cỏ dại:", LABEL.weeds[plot.state.weeds]),
    ];

    if (plant) {
        const age = Math.floor((Date.now() - plant.plantedAt) / 1000);
        lines.push(
            "",
            row("Cây:", LABEL.crop[plant.cropType]),
            row("Giai đoạn:", LABEL.growth[plant.state.growth]),
            row("Tình trạng:", LABEL.condition[plant.state.condition]),
            row("Sâu bệnh:", plant.state.hasPest ? "Có sâu bọ" : "Không"),
            row("Tuổi:", `${age}s`)
        );
    } else {
        lines.push("", "Chưa có cây");
    }

    overlay.textContent = lines.join("\n");
    overlay.classList.remove("hidden");
};