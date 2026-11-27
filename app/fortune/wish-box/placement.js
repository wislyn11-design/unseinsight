// All positions are percentages of the square island image, anchored at item feet.
const CENTER = { x: 50, y: 45 };
const RADIUS = { x: 44, y: 21 };
// Read old slot saves once, then persist continuous coordinates under the same key.
const LEGACY_SLOTS = [
  { x: 29, y: 37 }, { x: 49, y: 33 }, { x: 69, y: 37 },
  { x: 19, y: 48 }, { x: 39, y: 47 }, { x: 60, y: 47 }, { x: 79, y: 48 },
  { x: 43, y: 61 }, { x: 63, y: 61 }, { x: 81, y: 59 },
];
/** @param {number} x @param {number} y */
export function onLawn(x, y) {
  return Number.isFinite(x) && Number.isFinite(y) &&
    ((x - CENTER.x) / RADIUS.x) ** 2 + ((y - CENTER.y) / RADIUS.y) ** 2 <= 1.000001;
}
/** @param {number} x @param {number} y */
export function clampToLawn(x, y) {
  const dx = (x - CENTER.x) / RADIUS.x;
  const dy = (y - CENTER.y) / RADIUS.y;
  const scale = Math.max(1, Math.hypot(dx, dy));
  return { x: CENTER.x + dx / scale * RADIUS.x, y: CENTER.y + dy / scale * RADIUS.y };
}
/** @param {unknown} value @returns {{ x: number; y: number } | null} */
export function savedPosition(value) {
  if (!value || typeof value !== "object") return null;
  const item = /** @type {{ x?: unknown; y?: unknown; slot?: unknown }} */ (value);
  if (typeof item.x === "number" && typeof item.y === "number" && Number.isFinite(item.x) && Number.isFinite(item.y)) {
    return clampToLawn(item.x, item.y);
  }
  if (typeof item.slot === "number" && Number.isInteger(item.slot) && item.slot >= 0 && item.slot < LEGACY_SLOTS.length) {
    const old = LEGACY_SLOTS[item.slot];
    return clampToLawn(old.x, old.y);
  }
  return null;
}
