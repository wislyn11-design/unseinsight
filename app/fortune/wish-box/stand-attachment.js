import { clampToLawn } from "./placement.js";
/** @typedef {{x:number,y:number}} Position */
/** @typedef {Position & {id:string,kind:'flower'|'tree'|'candle'|'stand',parentStandId?:string}} Decoration */
/** @typedef {Position & {id:string}} Preview */
/** @param {Position} stand */
export function candleSeat(stand) { return { x: stand.x, y: stand.y - 8.8 }; }
/** @param {Decoration} item @param {Decoration[]} items @param {Preview|null} [preview] @returns {Position} */
export function displayPosition(item, items, preview = null) {
  if (preview?.id === item.id) return { x: preview.x, y: preview.y };
  const parent = item.kind === 'candle' ? items.find(entry => entry.id === item.parentStandId && entry.kind === 'stand') : undefined;
  if (parent) return candleSeat(preview?.id === parent.id ? preview : parent);
  return { x: item.x, y: item.y };
}
/** @param {Decoration[]} items @param {string} standId @param {string} [exceptId] */
export function occupiedStand(items, standId, exceptId = '') {
  return items.some(item => item.kind === 'candle' && item.parentStandId === standId && item.id !== exceptId);
}
/** @param {Position} position @param {Decoration[]} items @param {string} [exceptId] @param {string} [preferredStandId] @returns {Decoration|undefined} */
export function findStand(position, items, exceptId = '', preferredStandId) {
  const candidates = items.filter(item => item.kind === 'stand' && !occupiedStand(items,item.id,exceptId));
  if (preferredStandId) return candidates.find(item => item.id === preferredStandId);
  return candidates.map(item => {
    const seat = candleSeat(item);
    return { item, distance: ((position.x-seat.x)/10)**2 + ((position.y-seat.y)/5)**2 };
  }).filter(entry => entry.distance <= 1).sort((a,b) => a.distance-b.distance)[0]?.item;
}
/** @param {Decoration[]} items @param {string} id @param {Position} position @param {string} [preferredStandId] @param {boolean} [snap] @returns {Decoration[]} */
export function moveDecoration(items,id,position,preferredStandId,snap = true) {
  return items.map(item => {
    if(item.id !== id) return item;
    const stand = item.kind === 'candle' && snap ? findStand(position,items,id,preferredStandId) : undefined;
    if(stand) return { ...item, ...candleSeat(stand), parentStandId:stand.id };
    const { parentStandId: _oldParent, ...detached } = item;
    return { ...detached, ...clampToLawn(position.x,position.y) };
  });
}
/** @param {Decoration[]} items @param {string} id @returns {Decoration[]} */
export function removeDecoration(items,id) {
  const removed = items.find(item => item.id === id);
  return items.filter(item => item.id !== id).map(item => {
    if(item.parentStandId !== id) return item;
    const { parentStandId: _oldParent, ...detached } = item;
    return { ...detached, ...clampToLawn(removed?.x ?? item.x,removed?.y ?? item.y) };
  });
}
/** Remove dangling/duplicate links when loading without deleting decorations.
 * @param {Decoration[]} items @returns {Decoration[]} */
export function normalizeAttachments(items) {
  const used = new Set();
  return items.map(item => {
    if(!item.parentStandId) return item;
    const parent = items.find(entry => entry.id === item.parentStandId && entry.kind === 'stand');
    if(item.kind === 'candle' && parent && !used.has(parent.id)) {
      used.add(parent.id);return { ...item, ...candleSeat(parent) };
    }
    const { parentStandId: _oldParent, ...detached } = item;
    return detached;
  });
}
