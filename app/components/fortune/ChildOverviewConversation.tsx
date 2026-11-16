"use client";

import { useEffect, useRef, useState } from "react";

type Paragraph = { title: string; body: string };
type Story = { id: number; headline: string; keywords: string[]; paragraphs: Paragraph[]; tip: string };
type Observation = { question: string; answer: string | null; skipped: boolean; story: Story };
type Props = { chartId: string; calculatedAt: string; story: Story };
const headingClass = "border-l-[3px] border-[#6191ff] pl-4 text-[20px] font-bold";
const bodyClass = "mt-3 whitespace-pre-line pl-4 text-[20px] leading-[1.9] text-[#526582]";

function validObservation(value: Observation, question: string) {
  return value && value.question === question && typeof value.skipped === "boolean" &&
    (value.skipped ? value.answer === null : typeof value.answer === "string" && value.answer.trim().length > 0) &&
    value.story?.id === 201 && Array.isArray(value.story.paragraphs) && value.story.paragraphs.length === 4 &&
    value.story.paragraphs.every(p => typeof p.title === "string" && typeof p.body === "string");
}

export default function ChildOverviewConversation({ chartId, calculatedAt, story }: Props) {
  const question = story.paragraphs[1].body;
  const [answer, setAnswer] = useState("");
  const [observation, setObservation] = useState<Observation | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadRetry, setLoadRetry] = useState(0);
  const operation = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    operation.current?.abort(); operation.current = controller;
    setLoading(true); setLoadFailed(false); setError(""); setObservation(null); setAnswer(""); setEditing(false); setBusy(false);
    void (async () => {
      try {
        const response = await fetch("/api/fortune/overview", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chartId, section: "children", action: "load-child-observation" }), signal: controller.signal });
        const data = await response.json(); controller.signal.throwIfAborted();
        if (!response.ok || data?.success !== true) throw new Error(data?.error || "저장된 추가 풀이를 확인하지 못했습니다.");
        if (data.observation !== null) {
          if (!validObservation(data.observation, question)) throw new Error("저장된 추가 풀이의 형식을 확인하지 못했습니다.");
          setObservation(data.observation); setAnswer(data.observation.answer || "");
        }
      } catch (reason) { if (!controller.signal.aborted) { setLoadFailed(true); setError(reason instanceof Error ? reason.message : "추가 풀이를 확인하지 못했습니다."); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [chartId, calculatedAt, question, loadRetry]);

  useEffect(() => () => operation.current?.abort(), []);

  async function submit(skipped: boolean) {
    if (busy || loading || loadFailed) return;
    if (!skipped && !answer.trim()) { setError("답변을 적거나 건너뛰기를 눌러 주세요."); return; }
    operation.current?.abort(); const controller = new AbortController(); operation.current = controller;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/fortune/overview", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, section: "children", action: "child-observation", skipped, answer: skipped ? null : answer.trim() }), signal: controller.signal });
      const data = await response.json(); controller.signal.throwIfAborted();
      if (!response.ok || data?.success !== true) throw new Error(data?.error || "추가 풀이를 불러오지 못했습니다.");
      if (!validObservation(data.observation, question)) throw new Error("추가 풀이의 형식을 확인하지 못했습니다.");
      setObservation(data.observation); setAnswer(data.observation.answer || ""); setEditing(false);
    } catch (reason) { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "추가 풀이를 불러오지 못했습니다."); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }

  const showingResult = observation && !editing;
  const technical = showingResult ? observation.story.paragraphs[3].body : story.paragraphs[3].body;
  return <>
    <section className="border-b border-[#edf1f7] py-5"><h3 className={headingClass}>핵심 특징</h3><p className={bodyClass}>{story.paragraphs[0].body}</p></section>
    <section className="border-b border-[#edf1f7] py-5">
      <h3 className={headingClass}>생활에서 살펴볼 모습</h3>
      <p id="child-observation-question" className={bodyClass}>{question}</p>
      {loading ? <p role="status" className="mt-4 pl-4 text-[16px] text-[#63738d]">저장된 답변과 추가 풀이를 확인하고 있습니다.</p>
        : showingResult ? <div className="mt-5 rounded-lg border border-[#e4eaf4] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h4 className="text-[17px] font-semibold">{observation.skipped ? "추가 답변 없이 풀이했어요" : "부모님이 알려주신 모습"}</h4><button type="button" onClick={() => { setEditing(true); setError(""); }} className="min-h-11 rounded-lg border border-[#ccd7e9] px-4 text-[15px] font-semibold">답변 수정</button></div>
          <p className="mt-3 whitespace-pre-line text-[18px] leading-8 text-[#526582]">{observation.skipped ? "추가 사례를 받지 않고 저장된 만세력을 바탕으로 해석했습니다." : observation.answer}</p>
        </div> : <form onSubmit={event => { event.preventDefault(); void submit(false); }} className="mt-5 pl-4">
          <label htmlFor="child-observation-answer" className="block text-[16px] leading-7 text-[#63738d]">다른 모습이었다면 그것도 좋아요. 떠오르는 장면을 한두 문장으로 적어주세요.</label>
          <textarea id="child-observation-answer" value={answer} onChange={event => { setAnswer(event.target.value); setError(""); }} rows={4} maxLength={3000} disabled={busy} aria-describedby="child-observation-question child-observation-note" placeholder="아이의 실제 모습이나 기억나는 상황을 편하게 적어주세요." className="mt-3 w-full rounded-lg border border-[#ccd7e9] bg-white p-4 text-[18px] leading-8 text-[#233b60] focus:border-[#e87945] focus:outline-none focus:ring-2 focus:ring-[#efb58f]/30 disabled:opacity-60" />
          <p id="child-observation-note" className="mt-2 text-[14px] leading-6 text-[#7182a0]">답변은 선택 사항이에요. 답변과 추가 풀이는 이 아이의 기록으로 저장됩니다.</p>
          <div className="mt-4 flex flex-wrap gap-3"><button type="submit" disabled={busy || loadFailed || !answer.trim()} className="min-h-12 rounded-lg bg-[#ff825b] px-5 font-semibold text-white disabled:opacity-50">답변하고 풀이 보기</button><button type="button" disabled={busy || loadFailed} onClick={() => void submit(true)} className="min-h-12 rounded-lg border border-[#efb58f] bg-white px-5 font-semibold disabled:opacity-50">건너뛰고 풀이 보기</button>{editing && <button type="button" disabled={busy} onClick={() => { setEditing(false); setAnswer(observation?.answer || ""); setError(""); }} className="min-h-12 px-4 text-[16px] text-[#63738d]">수정 취소</button>}</div>
          <p className="mt-3 text-[14px] leading-6 text-[#7182a0]">건너뛰면 추가 사례 없이 만세력을 바탕으로 풀이합니다.</p>
        </form>}
      {busy && <p role="status" className="mt-4 pl-4 text-[16px] text-[#63738d]">아이의 사주와 답변을 함께 살펴보고 있습니다. 잠시 기다려 주세요.</p>}
      {error && <div role="alert" className="mt-4 pl-4 text-[16px] leading-7 text-red-600"><p>{error}</p>{loadFailed && <button type="button" disabled={busy} onClick={() => setLoadRetry(v => v + 1)} className="mt-2 min-h-11 rounded-lg border border-[#ccd7e9] px-4 text-[#526582]">저장 기록 다시 확인</button>}</div>}
    </section>
    {showingResult ? <section aria-label="아이를 위한 추가 풀이"><h3 className="mt-6 text-[23px] font-bold leading-9">{observation.story.headline}</h3>{observation.story.paragraphs.slice(0, 3).map(paragraph => <section key={paragraph.title} className="border-b border-[#edf1f7] py-5"><h4 className={headingClass}>{paragraph.title}</h4><p className={bodyClass}>{paragraph.body}</p></section>)}</section>
      : <section className="border-b border-[#edf1f7] py-5"><h3 className={headingClass}>부모가 해볼 일</h3><p className={bodyClass}>{story.paragraphs[2].body}</p></section>}
    <p className="mt-5 text-[16px] leading-8 text-[#526582]"><span className="mr-3 font-semibold text-[#2862e3]">기억할 한 가지</span>{showingResult ? observation.story.tip : story.tip}</p>
    <details className="mt-6 border-y border-[#e4eaf4] py-4"><summary className="cursor-pointer text-[18px] font-semibold">이렇게 풀이했어요<span className="ml-4 text-[14px] font-normal text-[#63738d]">아이의 만세력에서 읽은 근거</span></summary><p className="mt-4 whitespace-pre-line text-[18px] leading-[1.9] text-[#526582]">{technical}</p></details>
  </>;
}
