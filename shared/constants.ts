export const GRID = 5;
export const CELL = 64;

// Toa do o luoi (bat dau tu 1) -> toa do pixel cua tam o
export const cellCenter = (n: number): number => (n - 1) * CELL + CELL / 2;
