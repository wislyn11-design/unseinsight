"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { onLawn, clampToLawn, savedPosition } from "./placement";
import styles from "./wish-island.module.css";
import CandleSprite from "./CandleSprite";
import WoodenWishSign from "./WoodenWishSign";
import useWishChime from "./useWishChime";
import { displayPosition, findStand, occupiedStand, moveDecoration, removeDecoration, normalizeAttachments } from "./stand-attachment";

type Kind = "flower" | "tree" | "candle" | "stand";
type Position = { x: number; y: number };
type Decoration = Position & { id: string; kind: Kind; parentStandId?: string };
type Drag = { id: string; pointerId: number; startX: number; startY: number; original: Position; next: Position; moved: boolean };
const MAX_ITEMS = 60;
type Garden = { wish: string; decorations: Decoration[]; visits: string[] };
const STORAGE_KEY = "unseinsight:wish-island:demo:v1";
const INITIAL: Garden = { wish: "", decorations: [], visits: [] };
const ITEMS: Record<Kind, { name: string; image: string; width: number }> = {
  flower: { name: "꽃 화분", image: "/wish/items/flower.png", width: 15 },
  tree: { name: "소원 나무", image: "/wish/items/tree.png", width: 23 },
  candle: { name: "소원초", image: "/wish/items/candle-body.png", width: 23 },
  stand: { name: "나무 받침대", image: "/wish/items/candle-stand.png", width: 24 },
};
function localDay() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
}
function readGarden(value: string | null): Garden {
  if (!value) return INITIAL;
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object") return INITIAL;
  const data = parsed as Partial<Garden>;
  const ids = new Set<string>();
  const decorations: Decoration[] = [];
  if (Array.isArray(data.decorations)) for (const item of data.decorations) {
    if (!item || typeof item.id !== "string" || ids.has(item.id) ||
      (item.kind !== "flower" && item.kind !== "tree" && item.kind !== "candle" && item.kind !== "stand")) continue;
    const position = savedPosition(item);
    if (!position || decorations.length >= MAX_ITEMS) continue;
    decorations.push({ id: item.id, kind: item.kind, ...position, ...(typeof item.parentStandId === "string" ? { parentStandId: item.parentStandId } : {}) });
    ids.add(item.id);
  }
  return {
    wish: typeof data.wish === "string" ? data.wish.slice(0, 120) : "",
    decorations: normalizeAttachments(decorations),
    visits: Array.isArray(data.visits) ? [...new Set(data.visits.filter((date): date is string => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)))] : [],
  };
}

export default function WishBoxPage() {
  const [garden, setGarden] = useState<Garden>(INITIAL);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [placing, setPlacing] = useState<Kind | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [today, setToday] = useState("");
  const [prayerGlow, setPrayerGlow] = useState(false);
  const [effectId, setEffectId] = useState(0);
  const [effectCandle, setEffectCandle] = useState<string | null>(null);
  const chime = useWishChime();
  const suppressClick = useRef<string | null>(null);
  const glowTimer = useRef<number | null>(null);
  const islandRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [preview, setPreview] = useState<(Position & { id: string }) | null>(null);
  const [cursor, setCursor] = useState<Position>({ x: 50, y: 47 });

  useEffect(() => {
    try {
      const stored = readGarden(window.localStorage.getItem(STORAGE_KEY));
      setGarden(stored); setDraft(stored.wish);
    } catch { setMessage("저장 정보를 불러오지 못했습니다. 새 소원섬으로 시작합니다."); }
    setToday(localDay()); setReady(true);
    const refreshDay = () => setToday(localDay());
    window.addEventListener("focus", refreshDay);
    const timer = window.setInterval(refreshDay, 60000);
    return () => { window.removeEventListener("focus", refreshDay); window.clearInterval(timer); if (glowTimer.current !== null) window.clearTimeout(glowTimer.current); };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(garden)); setSaveError(false); }
    catch { setSaveError(true); }
  }, [garden, ready]);

  const selectedItem = garden.decorations.find((item) => item.id === selected);
  const arranging = placing !== null || moving;
  const prayedToday = today !== "" && garden.visits.includes(today);
  const activeKind = placing ?? (moving ? selectedItem?.kind : preview ? garden.decorations.find(item => item.id === preview.id)?.kind : null);
  const dropStand = activeKind === "candle" && preview ? findStand(preview, garden.decorations, preview.id) : undefined;

  function place(position: Position, preferredStandId?: string) {
    if (!ready || !arranging) return;
    const kind = moving && selectedItem ? selectedItem.kind : placing;
    const target = kind === "candle" ? findStand(position, garden.decorations, selectedItem?.id, preferredStandId) : undefined;
    if (kind === "candle" && preferredStandId && !target) {
      setMessage("이 받침대에는 이미 초가 있어요. 다른 받침대를 골라주세요."); return;
    }
    if (!target && !onLawn(position.x, position.y)) {
      setMessage("섬의 잔디나 초를 올릴 받침대 위를 눌러주세요."); return;
    }
    if (moving && selectedItem) {
      setGarden((old) => ({ ...old, decorations: moveDecoration(old.decorations, selectedItem.id, position, target?.id) }));
    } else if (placing) {
      const item: Decoration = { id: window.crypto.randomUUID(), kind: placing, ...position };
      setGarden((old) => old.decorations.length >= MAX_ITEMS ? old : ({ ...old, decorations: moveDecoration([...old.decorations, item], item.id, position, target?.id) }));
    }
    setMessage(target ? "받침대 위에 초를 올렸어요. 받침대를 옮기면 초도 함께 움직여요." : "원하는 자리에 놓았어요.");
    setPlacing(null); setMoving(false); setSelected(null);
  }
  function pointerPosition(clientX: number, clientY: number): Position | null {
    const rect = islandRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;
    return { x: (clientX - rect.left) / rect.width * 100, y: (clientY - rect.top) / rect.height * 100 };
  }
  function clickIsland(event: ReactMouseEvent<HTMLDivElement>) {
    if (!arranging) return;
    const position = pointerPosition(event.clientX, event.clientY);
    if (position) place(position);
  }
  function startDrag(event: ReactPointerEvent<HTMLButtonElement>, item: Decoration) {
    if (!ready || arranging || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.stopPropagation();
    suppressClick.current = null;
    dragRef.current = { id: item.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      original: displayPosition(item, garden.decorations), next: displayPosition(item, garden.decorations), moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(item.id);
  }
  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    const rect = islandRef.current?.getBoundingClientRect();
    if (!drag || drag.pointerId !== event.pointerId || !rect) return;
    const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    const next = { x: drag.original.x + dx / rect.width * 100, y: drag.original.y + dy / rect.height * 100 };
    const item = garden.decorations.find(entry => entry.id === drag.id);
    drag.next = item?.kind === "candle" && findStand(next, garden.decorations, drag.id) ? next : clampToLawn(next.x, next.y);
    setPreview({ id: drag.id, ...drag.next });
  }
  function finishDrag(event: ReactPointerEvent<HTMLButtonElement>, cancel = false) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (cancel || drag.moved) suppressClick.current = drag.id;
    if (!cancel && drag.moved) {
      const item = garden.decorations.find(entry => entry.id === drag.id);
      const target = item?.kind === "candle" ? findStand(drag.next, garden.decorations, drag.id) : undefined;
      setGarden((old) => ({ ...old, decorations: moveDecoration(old.decorations, drag.id, drag.next) }));
      setMessage(target ? "초가 받침대 위에 안착했어요." : item?.kind === "stand" ? "받침대와 그 위의 초를 함께 옮겼어요." : "원하는 위치로 옮겼어요.");
    }
    setPreview(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyboardItem(event: ReactKeyboardEvent<HTMLButtonElement>, item: Decoration) {
    const directions: Record<string, Position> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };
    const direction = directions[event.key];
    if (!direction || arranging) return;
    event.preventDefault(); event.stopPropagation();
    const step = event.shiftKey ? 3 : 1;
    const current = displayPosition(item, garden.decorations);
    const position = clampToLawn(current.x + direction.x * step, current.y + direction.y * step);
    setGarden((old) => ({ ...old, decorations: moveDecoration(old.decorations, item.id, position, undefined, false) }));
    setSelected(item.id);
  }
  function keyboardIsland(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || !arranging) return;
    const directions: Record<string, Position> = { ArrowLeft: { x: -2, y: 0 }, ArrowRight: { x: 2, y: 0 }, ArrowUp: { x: 0, y: -2 }, ArrowDown: { x: 0, y: 2 } };
    if (directions[event.key]) {
      event.preventDefault();
      setCursor((old) => clampToLawn(old.x + directions[event.key].x, old.y + directions[event.key].y));
    } else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); place(cursor); }
    else if (event.key === "Escape") { setPlacing(null); setMoving(false); }
  }
  function pray(candleId: string | null = null) {
    if (!ready) return;
    if (!garden.wish) { setEditing(true); setMessage("먼저 섬에 담을 소원을 적어주세요."); return; }
    setEffectCandle(candleId);
    setEffectId((old) => old + 1);
    setPrayerGlow(true);
    void chime.play();
    if (glowTimer.current !== null) window.clearTimeout(glowTimer.current);
    glowTimer.current = window.setTimeout(() => { setPrayerGlow(false); glowTimer.current = null; }, 2400);
    const date = localDay(); setToday(date);
    if (garden.visits.includes(date)) { setMessage("소원에 마음을 보탰어요. 촛불은 여러 번 눌러도 괜찮아요."); return; }
    setGarden((old) => ({ ...old, visits: old.visits.includes(date) ? old.visits : [...old.visits, date] }));
    setMessage("오늘의 마음을 보탰어요. 소원을 향한 작은 하루를 응원합니다.");
  }

  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <div><p className={styles.eyebrow}>소원함</p><h1>나의 소원섬</h1><p>소원을 담고, 나만의 섬을 꾸며요.</p></div>
        <span className={styles.days}>함께한 날 <strong>{garden.visits.length}일</strong></span>
      </div>
      <div className={styles.layout}>
        <section className={styles.scene} aria-label="나의 소원섬">
          <span className={`${styles.cloud} ${styles.cloudOne}`} aria-hidden="true" />
          <span className={`${styles.cloud} ${styles.cloudTwo}`} aria-hidden="true" />
          <WoodenWishSign wish={garden.wish} disabled={!ready} onEdit={() => { setDraft(garden.wish); setEditing(true); }} />
          <div ref={islandRef} className={`${styles.island} ${arranging ? styles.placing : ""}`} onClick={clickIsland} onKeyDown={keyboardIsland} tabIndex={arranging ? 0 : -1} role="group" aria-label="소원섬. 아이템 선택 후 잔디를 누르면 배치됩니다. 키보드로는 방향키로 위치를 정하고 엔터를 누르세요.">
            <img className={styles.base} src="/wish/island.png" alt="연못이 있는 초록색 소원섬" draggable={false} />
            {arranging && <div className={styles.placementGuide} aria-hidden="true" />}
            {arranging && <span className={styles.keyboardCursor} aria-hidden="true" style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}>＋</span>}
            {garden.decorations.map((item) => {
              const position = displayPosition(item, garden.decorations, preview);
              const parent = item.parentStandId ? garden.decorations.find(entry => entry.id === item.parentStandId) : undefined;
              const following = parent && preview?.id === parent.id;
              const depth = parent ? (following ? preview!.y : parent.y) : position.y;
              const available = item.kind === "stand" && activeKind === "candle" && !occupiedStand(garden.decorations, item.id, selected ?? "");
              return <button key={item.id} className={`${styles.decoration} ${selected === item.id ? styles.selected : ""} ${preview?.id === item.id ? styles.dragging : ""} ${available ? styles.availableStand : ""} ${dropStand?.id === item.id ? styles.targetStand : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%`, width: `${ITEMS[item.kind].width}%`, zIndex: preview?.id === item.id ? 97 : following ? 96 : Math.round(depth) + (parent ? 1 : 0) }} onPointerDown={(event) => startDrag(event, item)} onPointerMove={moveDrag} onPointerUp={(event) => finishDrag(event)} onPointerCancel={(event) => finishDrag(event, true)} onLostPointerCapture={(event) => finishDrag(event, true)} onKeyDown={(event) => keyboardItem(event, item)} onClick={(event) => {
                  if (arranging) {
                    if (item.kind === "stand" && activeKind === "candle") { event.stopPropagation(); place({ x: item.x, y: item.y }, item.id); }
                    return;
                  }
                  event.stopPropagation();
                  if (suppressClick.current === item.id) { suppressClick.current = null; return; }
                  setSelected(item.id);
                  if (item.kind === "candle") pray(item.id);
                }} aria-label={`${ITEMS[item.kind].name}. ${item.kind === "candle" ? "누르면 소원 별빛이 올라갑니다. " : ""}끌어서 이동하거나 방향키로 위치를 조절하세요.`} aria-pressed={selected === item.id}>
                {item.kind === "candle" ? <CandleSprite celebrating={prayerGlow && (!effectCandle || effectCandle === item.id)} effectId={effectId} /> : <img className={item.kind === "tree" && !preview ? styles.sway : undefined} src={ITEMS[item.kind].image} alt="" draggable={false} />}
              </button>;
            })}
          </div>
          <div className={styles.sceneHint}>{arranging ? activeKind === "candle" ? "받침대 위를 누르거나 초를 받침대 위로 끌어놓으세요." : "잔디 위 원하는 곳을 눌러주세요." : dropStand ? "놓으면 받침대 위에 초가 올라가요." : "받침대 위로 초를 끌어놓으면 자동으로 올라갑니다."}</div>
          <p className={styles.signHint}>나무 간판을 누르면 소원 전체를 보고 수정할 수 있어요.</p>
        </section>
        <aside className={styles.tools} aria-label="소원과 꾸미기 도구">
          <section className={styles.prayer}>
            <h2>오늘도 마음을 보태요</h2>
            <p>잠시 소원을 떠올리고<br />나를 위한 작은 시간을 가져보세요.</p>
            <button className={styles.primary} disabled={!ready} onClick={() => pray()}>{prayedToday ? "한 번 더 마음 보태기 ✦" : "오늘의 소원 빌기"}</button>
            <p className={styles.tapHint}>촛불을 톡 누르면 별빛이 올라가요.<br />여러 번 눌러도 괜찮아요.</p>
            <button className={styles.soundToggle} type="button" onClick={chime.toggle} aria-pressed={chime.enabled}>{chime.enabled ? "♪ 소리 켜짐" : "♪ 소리 꺼짐"}</button>
            {chime.issue && <p role="status" className={styles.soundIssue}>{chime.issue}</p>}
          </section>
          <section className={styles.inventory}>
            <h2>내 섬 꾸미기</h2><p>받침대를 놓고 소원초를 골라 그 위를 눌러보세요.</p>
            <div className={styles.items}>
              {(Object.keys(ITEMS) as Kind[]).map((kind) => (
                <button key={kind} disabled={!ready || garden.decorations.length >= MAX_ITEMS} aria-pressed={placing === kind} className={placing === kind ? styles.activeItem : ""} onClick={() => { setPlacing(kind); setSelected(null); setMoving(false); setMessage(""); }}>
                  {kind === "candle" ? <span className={styles.candleThumbnail}><CandleSprite /></span> : <img src={ITEMS[kind].image} alt="" />}<span>{ITEMS[kind].name}</span>
                </button>
              ))}
            </div>
            <p className={styles.capacity}>{garden.decorations.length}개 배치 · 겹쳐 놓거나 자유롭게 옮길 수 있어요. (최대 {MAX_ITEMS}개)</p>
            {selectedItem && !moving && <div className={styles.actions}><strong>{ITEMS[selectedItem.kind].name}</strong><button onClick={() => { setMoving(true); setPlacing(null); setCursor(clampToLawn(displayPosition(selectedItem, garden.decorations).x, displayPosition(selectedItem, garden.decorations).y)); }}>자리 눌러 이동</button><button onClick={() => { setGarden((old) => ({ ...old, decorations: removeDecoration(old.decorations, selectedItem.id) })); setSelected(null); setMessage("아이템을 섬에서 치웠어요. 목록에서 다시 놓을 수 있습니다."); }}>회수</button><button onClick={() => setSelected(null)}>닫기</button></div>}
            {arranging && <button className={styles.cancel} onClick={() => { setPlacing(null); setMoving(false); setSelected(null); }}>배치 취소</button>}
          </section>
          <p className={styles.status} role="status" aria-live="polite">{saveError ? "저장 공간에 접근할 수 없어 변경 사항을 보관하지 못했습니다." : message || (ready ? "이 기기의 브라우저에 자동 저장됩니다." : "소원섬을 불러오고 있어요…")}</p>
        </aside>
      </div>
      <p className={styles.note}>현재는 체험 버전입니다. 소원과 배치는 이 브라우저에 저장되며, 다른 기기나 계정과 연동되지 않습니다. 공용 기기에서는 개인적인 내용을 적지 마세요.</p>
      {editing && <section className={styles.editor} aria-label="소원 전체 보기 및 수정">
        <h2>섬에 담을 소원을 적어주세요</h2>
        <form onSubmit={(event) => { event.preventDefault(); const wish = draft.trim(); if (!wish) return; setGarden((old) => ({ ...old, wish })); setEditing(false); setMessage("소원을 나무 간판에 담았어요."); }}>
          <label htmlFor="wish-text">나의 소원</label>
          <textarea id="wish-text" value={draft} maxLength={120} rows={3} required autoFocus placeholder="예: 우리 가족이 건강하고 행복하기를" onChange={(event) => setDraft(event.target.value)} />
          <p className={styles.counter}>{draft.length} / 120</p>
          <div className={styles.editorActions}><button type="button" className={styles.cancel} onClick={() => setEditing(false)}>취소</button><button type="submit" disabled={!draft.trim()} className={styles.primary}>소원 담기</button></div>
        </form>
      </section>}
    </main>
  );
}
