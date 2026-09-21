"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import { ORACLE_CARDS } from "@/app/lib/oracle/cards";
import type { OracleCard } from "@/app/lib/oracle/cards";
import { shuffledOracleIndexes } from "@/app/lib/oracle/shuffle";

type DrawKind = "current" | "future";
type ReadingStatus = "idle" | "loading" | "retrying" | "success" | "error";

type ReadingState = Readonly<{
  status: ReadingStatus;
  reading: string;
  summary: string;
}>;

type InterpretResponse = {
  reading?: unknown;
  summary?: unknown;
};

type SessionResponse = {
  sessionId?: unknown;
  repeated?: unknown;
  similarityScore?: unknown;
  error?: unknown;
};

type PendingOracleStart = Readonly<{
  question: string;
  cardOrder: number[];
  sessionId: string;
  similarityScore: number;
}>;


const CARD_INDEXES = ORACLE_CARDS.map((_, index) => index);

const EMPTY_READING: ReadingState = { status: "idle", reading: "", summary: "" };

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(() => resolve(), milliseconds));
}

async function requestOracleInterpretation(
  payload: Record<string, string>,
  onRetry: () => void,
) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch("/api/oracle/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, retryCount: attempt }),
      });

      if (!response.ok) throw new Error(`Oracle interpretation failed: ${response.status}`);

      const result = await response.json() as InterpretResponse;
      const reading = typeof result.reading === "string" ? result.reading.trim() : "";
      const summary = typeof result.summary === "string" ? result.summary.trim() : "";
      if (!reading) throw new Error("Oracle interpretation is empty");

      return { reading, summary };
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        onRetry();
        await wait(800 * (attempt + 1));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Oracle interpretation failed");
}

function CardBack({ position, disabled, onClick }: { position: number; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group relative block aspect-[2/3] w-full overflow-hidden rounded-[18px] border border-[#8da9e8] bg-[linear-gradient(145deg,#1d459e_0%,#315fd1_48%,#263e91_100%)] p-2 shadow-[0_14px_34px_rgba(34,69,151,.2)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_20px_42px_rgba(34,69,151,.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9db8f4]/60 disabled:cursor-default disabled:hover:translate-y-0"
      aria-label={`${position + 1}번째 뒷면 카드 선택`}
    >
      <span className="absolute inset-2 rounded-[13px] border border-[#d9bf75]/80" />
      <span className="absolute inset-4 rounded-[10px] border border-white/20" />
      <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#e8cf87] bg-[#244ca7] text-xl text-[#f4dda0] shadow-inner transition duration-500 group-hover:rotate-12 group-hover:scale-105 sm:h-16 sm:w-16 sm:text-2xl" aria-hidden="true">✦</span>
    </button>
  );
}

function RevealedCard({ card, kind }: { card: OracleCard; kind: DrawKind }) {
  const isCurrent = kind === "current";
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [card.image]);

  return (
    <div
      className={`relative aspect-[2/3] w-full overflow-hidden rounded-[18px] border-2 bg-[#eaf0ff] shadow-[0_16px_38px_rgba(34,69,151,.24)] ${isCurrent ? "border-[#6f91df]" : "border-[#d4a54f]"}`}
      aria-label={`${isCurrent ? "첫 번째" : "두 번째"}로 선택한 ${card.title} 카드`}
    >
      {imageFailed ? (
        <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(145deg,#e9effc,#dce7fb)] px-3 text-center">
          <div>
            <p className="text-xs font-black text-[#315fca] sm:text-sm">{card.title}</p>
            <p className="mt-2 text-[10px] font-semibold leading-4 text-[#71809a]">카드 그림을 불러오지 못했습니다</p>
          </div>
        </div>
      ) : (
        <Image
          src={card.image}
          alt={`${card.title} 점괘 그림`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 30vw, (max-width: 1024px) 22vw, 150px"
          onError={() => setImageFailed(true)}
        />
      )}
      <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-black shadow-sm backdrop-blur-sm sm:text-xs ${isCurrent ? "bg-white/90 text-[#315fca]" : "bg-[#fff5de]/95 text-[#94631a]"}`}>
        {isCurrent ? "첫 번째" : "두 번째"}
      </span>
    </div>
  );
}

function LargeCardArtwork({ card, kind }: { card: OracleCard; kind: DrawKind }) {
  const isCurrent = kind === "current";
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [card.image]);

  return (
    <div
      className={`relative mx-auto aspect-[2/3] w-full max-w-[360px] overflow-hidden rounded-[24px] border-2 bg-[#eaf0ff] shadow-[0_22px_58px_rgba(34,69,151,.24)] ${isCurrent ? "border-[#7c9ce4]" : "border-[#d5aa5a]"}`}
      aria-label={`${isCurrent ? "첫 번째" : "두 번째"}로 선택한 ${card.title} 카드 큰 그림`}
    >
      {imageFailed ? (
        <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(145deg,#e9effc,#dce7fb)] px-6 text-center">
          <div>
            <p className="text-lg font-black text-[#315fca]">{card.title}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#71809a]">카드 그림을 불러오지 못했습니다</p>
          </div>
        </div>
      ) : (
        <Image
          src={card.image}
          alt={`${card.title} 점괘 큰 그림`}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 480px) 82vw, 360px"
          onError={() => setImageFailed(true)}
        />
      )}
      <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-black shadow-sm backdrop-blur-sm ${isCurrent ? "bg-white/90 text-[#315fca]" : "bg-[#fff5de]/95 text-[#94631a]"}`}>
        {isCurrent ? "첫 번째 점괘 · 현재" : "두 번째 점괘 · 미래"}
      </span>
    </div>
  );
}

function InterpretationBody({ state, onRetry }: { state: ReadingState; onRetry: () => void }) {
  if (state.status === "success") {
    return <p className="mt-4 text-[15px] font-medium leading-8 text-[#4f5f79] sm:text-base">{state.reading}</p>;
  }

  if (state.status === "error") {
    return (
      <div className="mt-4 rounded-2xl bg-[#fff7e8] px-5 py-4 text-[#735522]" role="alert">
        <p className="text-sm font-bold leading-6">풀이 중 오류가 있어 다시 풀이를 시작합니다.</p>
        <button type="button" onClick={onRetry} className="mt-3 rounded-xl bg-[#315fd3] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#2855c3]">
          풀이 다시 요청하기
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl bg-[#f5f8ff] px-5 py-4" aria-live="polite">
      <p className="animate-pulse text-sm font-bold leading-6 text-[#315fca]">
        {state.status === "retrying" ? "풀이 중 오류가 있어 다시 풀이를 시작합니다." : "선택한 카드와 고민을 연결해 풀이하고 있습니다."}
      </p>
    </div>
  );
}

export default function DailyOracleExperience() {
  const [questionDraft, setQuestionDraft] = useState("");
  const [question, setQuestion] = useState("");
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [futureIndex, setFutureIndex] = useState<number | null>(null);
  const [cardOrder, setCardOrder] = useState<number[]>([...CARD_INDEXES]);
  const [currentReading, setCurrentReading] = useState<ReadingState>(EMPTY_READING);
  const [futureReading, setFutureReading] = useState<ReadingState>(EMPTY_READING);
  const [drawing, setDrawing] = useState<DrawKind | null>(null);
  const [oracleSessionId, setOracleSessionId] = useState("");
  const [sessionStatus, setSessionStatus] = useState<"idle" | "saving" | "error">("idle");
  const [sessionError, setSessionError] = useState("");
  const [pendingStart, setPendingStart] = useState<PendingOracleStart | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(0);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const currentCard = useMemo(
    () => (currentIndex === null ? null : ORACLE_CARDS[currentIndex] ?? null),
    [currentIndex],
  );
  const futureCard = useMemo(
    () => (futureIndex === null ? null : ORACLE_CARDS[futureIndex] ?? null),
    [futureIndex],
  );

  const canSubmit = questionDraft.trim().length >= 4;

  const generateCurrentReading = async (index: number, sessionId = sessionRef.current) => {
    const card = ORACLE_CARDS[index];
    if (!card || !question || !oracleSessionId) return;

    setCurrentReading({ status: "loading", reading: "", summary: "" });

    try {
      const result = await requestOracleInterpretation(
        {
          sessionId: oracleSessionId,
          question,
          phase: "current",
          currentCardId: card.id,
        },
        () => {
          if (sessionRef.current === sessionId) {
            setCurrentReading({ status: "retrying", reading: "", summary: "" });
          }
        },
      );

      if (sessionRef.current === sessionId) {
        setCurrentReading({ status: "success", reading: result.reading, summary: "" });
        window.setTimeout(() => document.getElementById("oracle-current-reading")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } catch {
      if (sessionRef.current === sessionId) {
        setCurrentReading({ status: "error", reading: "", summary: "" });
      }
    }
  };

  const generateFutureReading = async (index: number, sessionId = sessionRef.current) => {
    const card = ORACLE_CARDS[index];
    if (!card || currentIndex === null || !currentCard || !question || !oracleSessionId) return;

    setFutureReading({ status: "loading", reading: "", summary: "" });

    try {
      const result = await requestOracleInterpretation(
        {
          sessionId: oracleSessionId,
          question,
          phase: "future",
          currentCardId: currentCard.id,
          futureCardId: card.id,
        },
        () => {
          if (sessionRef.current === sessionId) {
            setFutureReading({ status: "retrying", reading: "", summary: "" });
          }
        },
      );

      if (sessionRef.current === sessionId) {
        setFutureReading({ status: "success", reading: result.reading, summary: result.summary });
        window.setTimeout(() => document.getElementById("oracle-future-reading")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } catch {
      if (sessionRef.current === sessionId) {
        setFutureReading({ status: "error", reading: "", summary: "" });
      }
    }
  };

  const beginOracle = (start: Omit<PendingOracleStart, "similarityScore">) => {
    sessionRef.current += 1;
    setOracleSessionId(start.sessionId);
    setQuestion(start.question);
    setCurrentIndex(null);
    setFutureIndex(null);
    setCardOrder(start.cardOrder);
    setCurrentReading(EMPTY_READING);
    setFutureReading(EMPTY_READING);
    setDrawing(null);
    setPendingStart(null);
    setSessionStatus("idle");
    setSessionError("");
    window.setTimeout(() => document.getElementById("oracle-draw")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const submitQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || sessionStatus === "saving" || pendingStart) return;

    const nextQuestion = questionDraft.trim();
    const nextOrder = shuffledOracleIndexes(cardOrder);
    setSessionStatus("saving");
    setSessionError("");

    try {
      const response = await fetch("/api/oracle/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: nextQuestion,
          deckOrder: nextOrder.map((index) => ORACLE_CARDS[index]!.id),
        }),
      });
      const result = await response.json() as SessionResponse;
      const sessionId = typeof result.sessionId === "string" ? result.sessionId : "";
      if (!response.ok || !sessionId) {
        const message = typeof result.error === "string" ? result.error : "점괘 기록을 준비하지 못했습니다.";
        if (response.status === 401) {
          setSessionStatus("idle");
          setSessionError("");
          window.alert(message);
          return;
        }
        throw new Error(message);
      }

      if (result.repeated === true) {
        setPendingStart({
          question: nextQuestion,
          cardOrder: nextOrder,
          sessionId,
          similarityScore: typeof result.similarityScore === "number" ? result.similarityScore : 1,
        });
        setSessionStatus("idle");
        return;
      }

      beginOracle({ question: nextQuestion, cardOrder: nextOrder, sessionId });
    } catch (error) {
      setSessionStatus("error");
      setSessionError(error instanceof Error ? error.message : "점괘 시작 중 오류가 발생했습니다.");
    }
  };

  const editRepeatedQuestion = () => {
    if (!pendingStart) return;
    const abandonedSessionId = pendingStart.sessionId;
    setPendingStart(null);
    setSessionStatus("idle");
    setSessionError("");
    void fetch("/api/oracle/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: abandonedSessionId, action: "abandon" }),
    });
    window.setTimeout(() => document.getElementById("oracle-question")?.focus(), 50);
  };

  const selectCurrent = (index: number) => {
    if (!question || drawing || currentCard || !ORACLE_CARDS[index]) return;
    setDrawing("current");
    timerRef.current = window.setTimeout(() => {
      setCurrentIndex(index);
      setDrawing(null);
      void generateCurrentReading(index);
    }, 700);
  };

  const selectFuture = (index: number) => {
    if (currentIndex === null || index === currentIndex || drawing || futureCard || currentReading.status !== "success" || !ORACLE_CARDS[index]) return;
    setDrawing("future");
    timerRef.current = window.setTimeout(() => {
      setFutureIndex(index);
      setDrawing(null);
      void generateFutureReading(index);
    }, 700);
  };

  const resetOracle = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    sessionRef.current += 1;
    setQuestionDraft("");
    setQuestion("");
    setCurrentIndex(null);
    setFutureIndex(null);
    setCurrentReading(EMPTY_READING);
    setFutureReading(EMPTY_READING);
    setDrawing(null);
    setOracleSessionId("");
    setSessionStatus("idle");
    setSessionError("");
    setPendingStart(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-[calc(100vh-74px)] bg-[radial-gradient(circle_at_50%_0%,#e8efff_0%,#f7f9ff_38%,#f5f7fc_100%)] px-5 py-9 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <nav className="text-sm font-semibold text-[#7b879d]" aria-label="현재 위치">
          <Link href="/home" className="transition hover:text-[#2e63df]">홈</Link>
          <span className="mx-2" aria-hidden="true">›</span>
          <span className="text-[#283956]">오늘의 점괘</span>
        </nav>

        {!question && (
          <section className="relative mx-auto mt-10 max-w-3xl overflow-hidden rounded-[32px] border border-[#d8e3f6] bg-white px-5 py-8 shadow-[0_24px_70px_rgba(45,74,138,.12)] sm:px-10 sm:py-11">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#e8ecff] blur-3xl" />
            <div className="relative">
              <h1 className="text-2xl font-black tracking-[-.04em] text-[#172a4b] sm:text-3xl">오늘 가장 궁금한 것은 무엇인가요?</h1>
              <form onSubmit={submitQuestion} className="mt-6">
                <label htmlFor="oracle-question" className="sr-only">오늘의 고민</label>
                <textarea
                  id="oracle-question"
                  value={questionDraft}
                  onChange={(event) => setQuestionDraft(event.target.value.slice(0, 180))}
                  disabled={sessionStatus === "saving" || Boolean(pendingStart)}
                  rows={4}
                  placeholder="예: 지금 준비하고 있는 일을 계속 추진해도 괜찮을까요?"
                  className="w-full resize-none rounded-2xl border border-[#cfdaf0] bg-[#fbfcff] px-5 py-4 text-base font-semibold leading-7 text-[#263956] outline-none transition placeholder:text-[#a3adbd] focus:border-[#5d83df] focus:ring-4 focus:ring-[#dfe8fb]"
                />
                <div className="mt-2 text-right text-xs font-bold text-[#8793a6]">{questionDraft.length}/180</div>
                <button
                  type="submit"
                  disabled={!canSubmit || Boolean(drawing) || sessionStatus === "saving" || Boolean(pendingStart)}
                  className="mt-5 w-full rounded-2xl bg-[#315fd3] px-6 py-4 text-base font-black text-white shadow-[0_12px_28px_rgba(49,95,211,.25)] transition hover:bg-[#2855c3] disabled:cursor-not-allowed disabled:bg-[#aab8d6] sm:w-auto"
                >
                  {sessionStatus === "saving" ? "이전 점괘를 확인하고 있어요…" : "점괘 시작하기"}
                </button>
                {sessionStatus === "error" && sessionError && (
                  <div className="mt-4 rounded-2xl bg-[#fff7e8] px-5 py-4 text-sm font-bold leading-6 text-[#735522]" role="alert">
                    {sessionError}
                  </div>
                )}
                {pendingStart && (
                  <div className="mt-5 rounded-2xl border border-[#ead7ae] bg-[#fff9ec] px-5 py-5" role="alert">
                    <p className="text-base font-black text-[#6f501c]">오늘 이미 비슷한 고민으로 점괘를 확인했습니다.</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#7d6948]">
                      처음 받은 점괘가 현재의 흐름을 가장 잘 반영할 수 있지만, 원하시면 같은 고민으로 다시 확인할 수 있습니다.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => beginOracle(pendingStart)}
                        className="rounded-xl bg-[#315fd3] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#2855c3]"
                      >
                        그래도 새 점괘 보기
                      </button>
                      <button
                        type="button"
                        onClick={editRepeatedQuestion}
                        className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#5d6c84] ring-1 ring-[#d8c8a7] transition hover:bg-[#fffdf7]"
                      >
                        고민 수정하기
                      </button>
                    </div>
                  </div>
                )}
                <p className="mt-4 text-xs font-medium leading-5 text-[#8a95a8]">
                  입력한 고민과 생성 결과는 가명처리 후 서비스 개선·통계 분석·AI 학습에 활용될 수 있습니다.
                </p>
              </form>
            </div>
          </section>
        )}

        {question && (
          <section id="oracle-draw" className="scroll-mt-24">
            <div className="mx-auto mt-10 max-w-5xl text-center">
              <h1 className="text-2xl font-black tracking-[-.04em] text-[#172a4b] sm:text-3xl">
                {!currentCard
                  ? "지금의 상황을 보여줄 카드를 선택해 주세요"
                  : currentReading.status !== "success"
                    ? "첫 번째 카드의 풀이를 준비하고 있어요"
                  : !futureCard
                    ? "앞으로의 흐름을 보여줄 카드를 선택해 주세요"
                    : "선택한 두 장의 점괘"}
              </h1>
              <div id="oracle-card-grid" className="mt-7 grid scroll-mt-24 grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-5 lg:grid-cols-6">
                {cardOrder.map((index, position) => {
                  const card = ORACLE_CARDS[index]!;

                  if (index === currentIndex) {
                    return <RevealedCard key={card.id} card={card} kind="current" />;
                  }

                  if (index === futureIndex) {
                    return <RevealedCard key={card.id} card={card} kind="future" />;
                  }

                  return (
                    <CardBack
                      key={card.id}
                      position={position}
                      disabled={Boolean(drawing) || Boolean(futureCard) || (currentCard !== null && currentReading.status !== "success")}
                      onClick={() => currentIndex === null ? selectCurrent(index) : selectFuture(index)}
                    />
                  );
                })}
              </div>
              {drawing && (
                <p className="mt-5 animate-pulse text-sm font-extrabold text-[#315fca]" aria-live="polite">
                  {drawing === "current" ? "선택한 첫 번째 점괘를 펼치고 있어요…" : "선택한 두 번째 점괘를 펼치고 있어요…"}
                </p>
              )}
            </div>

            {currentCard && (
              <article id="oracle-current-reading" className="mx-auto mt-8 max-w-4xl scroll-mt-24 rounded-[28px] border border-[#cfdcf5] bg-white px-6 py-7 shadow-[0_18px_48px_rgba(45,74,138,.1)] sm:px-9 sm:py-9" aria-live="polite">
                <LargeCardArtwork card={currentCard} kind="current" />
                <div className="mt-7 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-center">
                  <h2 className="text-2xl font-black tracking-[-.04em] text-[#152846] sm:text-3xl">{currentCard.title}</h2>
                  <p className="text-sm font-extrabold text-[#b17826]">{currentCard.keywords}</p>
                </div>
                <InterpretationBody
                  state={currentReading}
                  onRetry={() => {
                    if (currentIndex !== null) void generateCurrentReading(currentIndex);
                  }}
                />
              </article>
            )}

            {currentCard && currentReading.status === "success" && !futureCard && (
              <section className="mx-auto mt-5 max-w-4xl rounded-[26px] border border-[#cddaf3] bg-[linear-gradient(145deg,#f8faff,#edf3ff)] px-6 py-7 text-center shadow-[0_14px_38px_rgba(45,74,138,.09)]">
                <p className="text-xl font-black tracking-[-.03em] text-[#172a4b]">이제 두 번째 카드를 뽑아주세요</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#6d7b92]">위의 카드 중 마음이 가는 한 장을 선택하면 앞으로의 흐름을 보여드립니다.</p>
                <button
                  type="button"
                  onClick={() => document.getElementById("oracle-card-grid")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="mt-5 rounded-xl bg-[#315fd3] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(49,95,211,.22)] transition hover:bg-[#2855c3]"
                >
                  두 번째 카드 선택하기
                </button>
              </section>
            )}

            {futureCard && currentCard && (
              <>
                <article id="oracle-future-reading" className="mx-auto mt-5 max-w-4xl scroll-mt-24 rounded-[28px] border border-[#e6d9c1] bg-white px-6 py-7 shadow-[0_18px_48px_rgba(122,91,38,.09)] sm:px-9 sm:py-9" aria-live="polite">
                  <LargeCardArtwork card={futureCard} kind="future" />
                  <div className="mt-7 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-center">
                    <h2 className="text-2xl font-black tracking-[-.04em] text-[#152846] sm:text-3xl">{futureCard.title}</h2>
                    <p className="text-sm font-extrabold text-[#b17826]">{futureCard.keywords}</p>
                  </div>
                  <InterpretationBody
                    state={futureReading}
                    onRetry={() => {
                      if (futureIndex !== null) void generateFutureReading(futureIndex);
                    }}
                  />
                </article>

                {futureReading.status === "success" && futureReading.summary && (
                  <section className="mx-auto mt-7 max-w-4xl rounded-[32px] border border-[#d7e2f5] bg-[linear-gradient(145deg,#f9fbff,#eef4ff)] px-6 py-8 shadow-[0_18px_48px_rgba(45,74,138,.1)] sm:px-10">
                    <div className="flex items-start gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#315fd3] text-xl text-white shadow-md" aria-hidden="true">✦</span>
                      <div>
                        <p className="text-sm font-extrabold text-[#315fca]">오늘의 종합 풀이</p>
                        <h2 className="mt-2 text-xl font-black text-[#172a4b]">두 점괘를 함께 살펴보면</h2>
                      </div>
                    </div>
                    <p className="mt-5 text-[15px] font-medium leading-8 text-[#4f5f79] sm:text-base">{futureReading.summary}</p>
                    <div className="mt-6 flex flex-col gap-3 border-t border-[#dce5f4] pt-6 sm:flex-row sm:justify-end">
                      <button type="button" onClick={resetOracle} className="rounded-xl bg-[#315fd3] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#2855c3]">다른 고민으로 점괘 보기</button>
                      <Link href="/home" className="rounded-xl bg-white px-5 py-3 text-center text-sm font-extrabold text-[#315fca] ring-1 ring-[#cfdbf0] transition hover:bg-[#f4f7ff]">다른 운세 둘러보기</Link>
                    </div>
                  </section>
                )}
              </>
            )}
          </section>
        )}

        <p className="mx-auto mt-7 max-w-2xl text-center text-xs font-medium leading-5 text-[#929caf]">
          오늘의 점괘는 고민을 정리하기 위한 참고 콘텐츠입니다. 중요한 결정은 실제 상황과 충분한 정보를 함께 살펴보세요.
        </p>
      </div>
    </main>
  );
}
