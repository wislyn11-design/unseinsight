"use client";
import { useEffect, useRef, useState } from "react";

const SOUND_KEY = "unseinsight:wish-island:sound:v1";
export default function useWishChime() {
  const [enabled, setEnabled] = useState(true);
  const [issue, setIssue] = useState("");
  const enabledRef = useRef(true);
  const audio = useRef<AudioContext | null>(null);
  const voices = useRef<OscillatorNode[]>([]);
  const lastPlayed = useRef(-Infinity);
  const disposed = useRef(false);
  function stopVoices() {
    for (const voice of voices.current) { try { voice.stop(); } catch { /* Already ended. */ } }
    voices.current = [];
  }
  useEffect(() => {
    disposed.current = false;
    try { const saved = window.localStorage.getItem(SOUND_KEY); if (saved !== null) { enabledRef.current = saved === "on"; setEnabled(enabledRef.current); } } catch { /* Session-only preference. */ }
    return () => { disposed.current = true; stopVoices(); const context = audio.current; audio.current = null; if (context && context.state !== "closed") void context.close().catch(() => {}); };
  }, []);
  function toggle() {
    const next = !enabled;
    enabledRef.current = next;
    if (!next) stopVoices();
    setEnabled(next); setIssue("");
    try { window.localStorage.setItem(SOUND_KEY, next ? "on" : "off"); } catch { /* Session-only preference. */ }
  }
  async function play() {
    if (!enabled || disposed.current) return;
    const now = performance.now();
    if (now - lastPlayed.current < 300) return;
    lastPlayed.current = now;
    try {
      const Audio = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Audio) { setIssue("이 브라우저에서는 소리를 재생할 수 없습니다."); return; }
      const context = audio.current ?? new Audio(); audio.current = context;
      if (context.state === "suspended") await context.resume();
      if (disposed.current || !enabledRef.current || audio.current !== context || context.state === "closed") return;
      stopVoices();
      const start = context.currentTime;
      // A short ascending bell shimmer, synthesized locally; no remote audio request.
      [1046.5, 1318.5, 1568, 2093, 2637].forEach((frequency, index) => {
        const voice = context.createOscillator();
        const envelope = context.createGain();
        const at = start + index * 0.075;
        voice.type = "sine"; voice.frequency.value = frequency;
        envelope.gain.setValueAtTime(0.0001, at);
        envelope.gain.exponentialRampToValueAtTime(0.045, at + 0.012);
        envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.85);
        voice.connect(envelope); envelope.connect(context.destination);
        voices.current.push(voice);
        voice.onended = () => { voice.disconnect(); envelope.disconnect(); voices.current = voices.current.filter(entry => entry !== voice); };
        voice.start(at); voice.stop(at + 0.9);
      });
      setIssue("");
    } catch { if (!disposed.current) setIssue("소리가 재생되지 않았습니다. 소리 설정을 확인해주세요."); }
  }
  return { enabled, toggle, play, issue };
}
