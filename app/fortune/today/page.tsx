"use client";

import Link from "next/link";
import FortunePageIntro from "@/app/components/fortune/page-intro/FortunePageIntro";
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type FortuneSection = {
  score?: number;
  title?: string;
  description?: string;
  advice?: string;
  detail?: {
    reason?: string;
    flow?: string;
    goodActions?: string[];
    avoidActions?: string[];
    evidenceKeys?: string[];
  };
  [key: string]: unknown;
};

type TimeFlow = {
  period?: string;
  score?: number;
  description?: string;
};

type TodayCaution = {
  area?: string;
  level?: string;
  title?: string;
  reason?: string;
  action?: string;
  evidenceKeys?: string[];
};

type DailyInsight = {
  headline?: string;
  scene?: string;
  reason?: string;
  caution?: string;
  prescription?: string;
  doActions?: string[];
  dontActions?: string[];
  keyword?: string;
  moodScore?: number;
  evidenceKeys?: string[];
};

type TodayFortune = {
  date: string;
  dayPillar?: string;
  overall: FortuneSection;
  wealth: FortuneSection;
  love: FortuneSection;
  workStudy: FortuneSection;
  health: FortuneSection;
  dailyInsight?: DailyInsight;
  timeFlow: TimeFlow[];
  luckyColor?: string;
  luckyNumbers?: number[];
  recommendedActivity?: string;
  caution?: string;
  cautions?: TodayCaution[];
  advice?: string;
};

type StreamedSection = {
  key: string;
  title: string;
  description: string;
};

type IntroProfile = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthTimeUnknown: boolean;
  calendarType: string;
  isLeapMonth: boolean;
};

const LOADING_MESSAGE = "오늘의 흐름을 꼼꼼히 살펴 오늘의 운세를 풀이하고 있습니다.";

type IconProps = { className?: string };

const DETAIL_SECTIONS = [
  {
    key: "overall",
    label: "오늘의 총평",
    eyebrow: "OVERALL",
    color: "#3a5bbf",
  },
  {
    key: "wealth",
    label: "재물운",
    eyebrow: "WEALTH",
    color: "#168456",
  },
  {
    key: "workStudy",
    label: "직장·학업운",
    eyebrow: "WORK & STUDY",
    color: "#b66a0a",
  },
  {
    key: "love",
    label: "대인관계·애정운",
    eyebrow: "RELATIONSHIPS",
    color: "#c7356d",
  },
  {
    key: "health",
    label: "건강·컨디션운",
    eyebrow: "WELLNESS",
    color: "#6750c7",
  },
] as const;

const ISSUE_OPTIONS = [
  ["too_generic", "내용이 너무 일반적이에요"],
  ["not_matched", "나의 상황과 맞지 않아요"],
  ["not_enough_detail", "설명이 부족해요"],
  ["not_actionable", "조언이 실용적이지 않아요"],
] as const;

const HELPFUL_OPTIONS = [
  ["matched_me", "나의 상황과 잘 맞아요"],
  ["specific", "설명이 구체적이에요"],
  ["easy_to_understand", "내용을 이해하기 쉬워요"],
  ["actionable", "조언을 실천하기 좋아요"],
] as const;

function seoulToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDate(dateText: string, days: number) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 3));

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function koreanDate(dateText: string) {
  if (!dateText) {
    return "오늘 날짜를 확인하고 있습니다.";
  }

  const date = new Date(`${dateText}T12:00:00+09:00`);

  if (Number.isNaN(date.getTime())) {
    return "오늘 날짜를 확인하고 있습니다.";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function koreanBirthTime(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  const padded = digits.padStart(4, "0").slice(-4);
  return `${Number(padded.slice(0, 2))}시 ${padded.slice(2)}분`;
}

function ArrowIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function LuckyItem({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-[120px] min-w-0 grid-rows-[auto_auto] content-center gap-y-2 rounded-[28px] border border-[#dce4f1] bg-white px-5 py-5">
      <div className="flex min-w-0 items-center justify-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
          {icon}
        </div>
        <p className="today-fortune-lucky-label whitespace-nowrap font-bold text-[#111111]">
          {label}
        </p>
      </div>

      <strong className="today-fortune-lucky-value block break-keep text-center font-extrabold tracking-[-0.02em] text-[#111111]">
        {children}
      </strong>
    </div>
  );
}

function FortuneDetailCard({
  section,
  label,
  eyebrow,
  color,
  featured = false,
}: {
  section: FortuneSection;
  label: string;
  eyebrow: string;
  color: string;
  featured?: boolean;
}) {
  const goodAction = section.detail?.goodActions?.[0];
  const avoidAction = section.detail?.avoidActions?.[0];

  return (
    <article
      className={`overflow-hidden rounded-[20px] border border-[#e4e9f1] bg-white shadow-[0_8px_24px_rgba(30,45,72,.045)] ${
        featured ? "lg:col-span-2" : ""
      }`}
    >
      <div className="h-1.5" style={{ backgroundColor: color }} />
      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <div>
          <p
            className="today-detail-eyebrow font-extrabold tracking-[.13em]"
            style={{ color }}
          >
            {eyebrow}
          </p>
          <h3 className="today-detail-name mt-1.5 font-bold tracking-[-.025em] text-[#303a4f]">
            {label}
          </h3>
        </div>

        <h4
          className={`today-detail-title mt-4 font-extrabold tracking-[-.035em] text-[#172033] ${
            featured ? "today-detail-title-featured" : ""
          }`}
        >
          {section.title || label}
        </h4>

        {/* Gemini가 작성한 사주풀이 원문 전체 그대로 출력 */}
        <p
          className={`today-fortune-body mt-4 whitespace-pre-wrap font-normal tracking-[-.012em] text-[#384252] ${
            featured ? "max-w-[1120px]" : ""
          }`}
        >
          {section.description}
        </p>

        {/* Gemini의 명리적 분석 근거 및 흐름 원문 */}
        {section.detail?.reason && (
          <div className="mt-5 rounded-2xl bg-[#f4f7fc] p-5">
            <p className="today-fortune-label font-extrabold text-[#3a5bbf]">
              명리적 원인 및 분석 근거
            </p>
            <p className="today-fortune-body mt-2 whitespace-pre-wrap text-[#414d61]">
              {section.detail.reason}
            </p>
          </div>
        )}

        {(goodAction || avoidAction) && (
          <div className={`mt-6 grid gap-4 ${featured ? "sm:grid-cols-2" : ""}`}>
            {goodAction && (
              <div className="rounded-2xl bg-[#eff6ff] px-5 py-4 border border-[#dbeafe]">
                <p className="today-fortune-label font-extrabold text-[#1d4ed8]">
                  오늘의 추천 실천
                </p>
                <p className="today-fortune-body mt-2 font-medium text-[#1e3a8a]">
                  {goodAction}
                </p>
              </div>
            )}
            {avoidAction && (
              <div className="rounded-2xl bg-[#fffbe2] px-5 py-4 border border-[#fef08a]">
                <p className="today-fortune-label font-extrabold text-[#a16207]">
                  오늘의 주의할 점
                </p>
                <p className="today-fortune-body mt-2 font-medium text-[#713f12]">
                  {avoidAction}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function LoadingState({
  status,
  sections,
}: {
  status: string;
  sections: StreamedSection[];
}) {
  return (
    <section className="min-h-[430px] rounded-2xl border border-[#e0e6ef] bg-white px-6 py-10 shadow-sm sm:px-10">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#dbe5ff] border-t-[#2563eb]" />
        <p className="today-loading-title mt-6 font-extrabold text-[#1a2542]">
          {status || LOADING_MESSAGE}
        </p>
      </div>

      {sections.length > 0 && (
        <div className="mx-auto mt-8 grid max-w-4xl gap-4" aria-live="polite">
          {sections.map((section) => (
            <article
              key={section.key}
              className="rounded-2xl border border-[#e3e8f0] bg-[#f8f9fc] px-6 py-5 text-left"
            >
              <h2 className="today-loading-section-title font-extrabold text-[#1d2537]">{section.title}</h2>
              <p className="today-loading-section-body mt-3 whitespace-pre-wrap text-[#4f5b70]">
                {section.description}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function TodayFortunePage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [fortune, setFortune] = useState<TodayFortune | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [interpretationId, setInterpretationId] = useState("");
  
  const [introProfile, setIntroProfile] =
  useState<IntroProfile | null>(null);

  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [feedbackChoice, setFeedbackChoice] = useState<boolean | null>(null);
  const [helpfulTopics, setHelpfulTopics] = useState<string[]>([]);
  const [issueTypes, setIssueTypes] = useState<string[]>([]);
  const [feedbackLocked, setFeedbackLocked] = useState(false);
  const [pointBalance, setPointBalance] = useState(0);
  const [streamStatus, setStreamStatus] = useState("");
  const [streamSections, setStreamSections] = useState<StreamedSection[]>([]);

  const loadFortune = useCallback(
    async (date: string, signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      setStreamStatus(LOADING_MESSAGE);
      setStreamSections([]);
      let showedCachedFortune = false;

      try {
        const storedSaju = sessionStorage.getItem("unseinsight:lastSaju");
        let activeEntry: any = null;

        if (storedSaju) {
          try {
            activeEntry = JSON.parse(storedSaju);
          } catch {
            sessionStorage.removeItem("unseinsight:lastSaju");
          }
        }

        if (!activeEntry?.chartId) {
          const chartResponse = await fetch("/api/saju-charts", {
            method: "GET",
            cache: "no-store",
            signal,
          });
          const chartData = await chartResponse.json().catch(() => null);

          if (chartResponse.ok && chartData?.success && chartData?.entry?.chartId) {
            activeEntry = chartData.entry;
            sessionStorage.setItem(
              "unseinsight:lastSaju",
              JSON.stringify(activeEntry),
            );
          } else if (chartResponse.status === 401) {
            throw new Error("로그인 후 오늘의 운세를 확인해 주세요.");
          } else {
            throw new Error(
              "DB에 저장된 만세력 정보가 없습니다. 만세력을 먼저 계산해 주세요.",
            );
          }
        }

        const localChart = activeEntry?.chart || activeEntry;
        const chartId = activeEntry?.chartId;
        const profile = activeEntry?.profile || activeEntry?.birthProfile || {};
        const name = profile.profileName || profile.profile_name || localChart?.profileName || "";
        const birthDate = profile.birthDate || profile.birth_date || localChart?.solarDate || "";
        const birthTime = profile.birthTime || profile.birth_time || localChart?.birthTime || "";
        
        const unknownTime = Boolean(
          profile.birthTimeUnknown ??
            profile.birth_time_unknown ??
            localChart?.birthTimeUnknown ??
            localChart?.birth_time_unknown ??
            false,
        );
        
        const calendarType =
          profile.calendarType ||
          profile.calendar_type ||
          localChart?.calendarType ||
          localChart?.calendar_type ||
          "solar";
        
        const isLeapMonth = Boolean(
          profile.isLeapMonth ??
            profile.is_leap_month ??
            localChart?.isLeapMonth ??
            localChart?.is_leap_month ??
            false,
        );
        
        setIntroProfile({
          name: name || "사용자",
          birthDate,
          birthTime: unknownTime ? "" : koreanBirthTime(birthTime),
          birthTimeUnknown: unknownTime,
          calendarType,
          isLeapMonth,
        });


        if (!chartId) {
          throw new Error(
            "저장된 만세력과 연결할 수 없습니다. 로그인 상태에서 만세력을 다시 계산해 주세요.",
          );
        }

        const fortuneCacheKey = `unseinsight:today-fortune:${chartId}:${date}`;

        try {
          const cachedText = sessionStorage.getItem(fortuneCacheKey);
          if (cachedText) {
            const cached = JSON.parse(cachedText);
            if (cached?.fortune && cached?.date === date) {
              showedCachedFortune = true;
              setFortune(cached.fortune as TodayFortune);
              setInterpretationId(String(cached.interpretationId || ""));
              setStreamSections([]);
              setStreamStatus("");
              setFeedbackStatus("");
              setFeedbackChoice(null);
              setHelpfulTopics([]);
              setIssueTypes([]);
              setFeedbackLocked(false);
              setLoading(false);
              return;
            } else {
              sessionStorage.removeItem(fortuneCacheKey);
            }
          }
        } catch {
          try {
            sessionStorage.removeItem(fortuneCacheKey);
          } catch {
            // 브라우저 저장소를 사용할 수 없으면 DB 결과만 사용합니다.
          }
        }

        const response = await fetch("/api/fortune/today", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chartId,
            date,
          }),
          signal,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || "오늘의 운세를 불러오지 못했습니다.");
        }

        if (!response.body) {
          throw new Error("Gemini 스트리밍 응답을 받을 수 없습니다.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let completedFortune: TodayFortune | null = null;
        let nextInterpretationId = "";

        const handleEvent = (event: any) => {
          if (event?.type === "status") {
            setStreamStatus(LOADING_MESSAGE);
            return;
          }

          if (event?.type === "reset") {
            setStreamSections([]);
            return;
          }

          if (event?.type === "section" && event?.value) {
            setStreamSections((current) => {
              const next = current.filter((item) => item.key !== event.key);
              return [
                ...next,
                {
                  key: String(event.key || ""),
                  title: String(event.value.title || ""),
                  description: String(event.value.description || ""),
                },
              ];
            });
            return;
          }

          if (event?.type === "complete" && event?.fortune) {
            completedFortune = event.fortune as TodayFortune;
            nextInterpretationId = String(event.interpretationId || "");
            return;
          }

          if (event?.type === "error") {
            throw new Error(event.error || "Gemini 운세 생성에 실패했습니다. 다시 시도해 주세요.");
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex = buffer.indexOf("\n");
          while (newlineIndex >= 0) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            if (line) handleEvent(JSON.parse(line));
            newlineIndex = buffer.indexOf("\n");
          }
        }

        buffer += decoder.decode();
        if (buffer.trim()) handleEvent(JSON.parse(buffer.trim()));
        if (!completedFortune) {
          throw new Error("Gemini 운세 생성이 완료되지 않았습니다. 다시 시도해 주세요.");
        }

        setFortune(completedFortune);
        setInterpretationId(nextInterpretationId);
        setStreamSections([]);
        setStreamStatus("");
        setFeedbackStatus("");
        setFeedbackChoice(null);
        setHelpfulTopics([]);
        setIssueTypes([]);
        setFeedbackLocked(false);

        try {
          sessionStorage.setItem(
            fortuneCacheKey,
            JSON.stringify({
              fortune: completedFortune,
              interpretationId: nextInterpretationId,
              chartId,
              date,
              cachedAt: Date.now(),
            }),
          );
        } catch {
          // 브라우저 저장에 실패해도 DB에서 받은 운세는 그대로 표시합니다.
        }

        if (nextInterpretationId) {
          const statusResponse = await fetch(
            `/api/fortune/feedback?interpretationId=${encodeURIComponent(nextInterpretationId)}`,
            { cache: "no-store", signal },
          );
          const statusData = await statusResponse.json().catch(() => null);
          if (statusResponse.ok && statusData?.success) {
            setFeedbackLocked(Boolean(statusData.evaluated));
            setFeedbackChoice(statusData.evaluated ? statusData.helpful : null);
            setPointBalance(Number(statusData.pointBalance || 0));
          }
        }
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;

        if (showedCachedFortune) {
          console.error("오늘의 운세 백그라운드 갱신 오류:", reason);
          return;
        }

        setFortune(null);
        setError(
          reason instanceof Error
            ? reason.message
            : "오늘의 운세를 불러오지 못했습니다.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    setSelectedDate(seoulToday());
  }, []);

  useEffect(() => {
    if (!selectedDate) return;

    const controller = new AbortController();
    void loadFortune(selectedDate, controller.signal);

    return () => controller.abort();
  }, [selectedDate, loadFortune]);

  const today = selectedDate ? seoulToday() : "";
  const isToday = Boolean(selectedDate && today && selectedDate >= today);

  const showPreviousDay = () => setSelectedDate((date) => shiftDate(date, -1));
  const showNextDay = () => {
    if (isToday) return;
    setSelectedDate((date) => {
      const nextDate = shiftDate(date, 1);
      return nextDate > today ? today : nextDate;
    });
  };

  const submitFeedback = async ({
    choice = feedbackChoice,
    nextHelpfulTopics = helpfulTopics,
    nextIssueTypes = issueTypes,
  }: {
    choice?: boolean | null;
    nextHelpfulTopics?: string[];
    nextIssueTypes?: string[];
  } = {}) => {
    if (!interpretationId) return;
    if (choice === null) return;
    if (feedbackLocked || feedbackStatus === "saving") return;
    setFeedbackStatus("saving");
    try {
      const response = await fetch("/api/fortune/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interpretationId,
          topic: "overall",
          helpful: choice,
          helpfulTopics: nextHelpfulTopics,
          issueTypes: nextIssueTypes,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || "평가를 저장하지 못했습니다.");
      setFeedbackLocked(true);
      setPointBalance(Number(data.pointBalance || 0));
      setFeedbackStatus(data.alreadyEvaluated ? "already" : "rewarded");
    } catch (reason) {
      setFeedbackStatus(reason instanceof Error ? reason.message : "평가를 저장하지 못했습니다.");
    }
  };

  return (
    <main className="today-fortune-page min-h-full bg-[#f7f9fd]">
      <FortunePageIntro
        serviceTitle="오늘의 운세"
        sentence=""
        description={
          selectedDate
            ? `${koreanDate(selectedDate)}${
                fortune?.dayPillar
                  ? ` · ${fortune.dayPillar}일`
                  : ""
              }`
            : "오늘 날짜를 확인하고 있습니다."
        }
        profile={introProfile as any}
      />
  
      <div className="mx-auto w-full max-w-[1640px] px-5 pb-6 sm:px-8 lg:px-10">
        <div className="mb-6 flex justify-end">
          <div className="flex items-center gap-2 pb-0.5">
            <button
              type="button"
              onClick={showPreviousDay}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#dce2ed] bg-white text-[#697386] transition hover:border-[#aebde9] hover:text-[#3a5bbf]"
              aria-label="이전 날짜"
            >
              <ArrowIcon className="h-4 w-4 rotate-180" />
            </button>
  
            <button
              type="button"
              onClick={() => setSelectedDate(seoulToday())}
              className="today-date-button h-10 rounded-xl border border-[#dce2ed] bg-white px-5 font-bold text-[#5f697d] transition hover:border-[#aebde9] hover:text-[#3a5bbf]"
            >
              오늘
            </button>
  
            <button
              type="button"
              onClick={showNextDay}
              disabled={isToday}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#dce2ed] bg-white text-[#697386] transition hover:border-[#aebde9] hover:text-[#3a5bbf] disabled:cursor-not-allowed disabled:bg-[#f3f5f8] disabled:text-[#b8bfcb]"
              aria-label={
                isToday
                  ? "내일의 운세는 자정부터 확인할 수 있습니다"
                  : "다음 날짜"
              }
              title={
                isToday
                  ? "내일의 운세는 자정부터 확인할 수 있어요"
                  : undefined
              }
            >
              <ArrowIcon className="h-4 w-4" />
            </button>
          </div>
        </div>




        {loading && (
          <LoadingState
            status={streamStatus}
            sections={streamSections}
          />
        )}

        {!loading && error && (
          <section className="rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
            <h2 className="today-error-title font-extrabold text-red-600">
              오늘의 운세를 불러오지 못했습니다
            </h2>
            <p className="today-error-body mt-3 break-words text-[#5c6678]">{error}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void loadFortune(selectedDate)}
                className="today-action-button rounded-xl bg-[#2563eb] px-6 py-3.5 font-bold text-white"
              >
                다시 시도
              </button>
              <Link
                href="/"
                className="today-action-button rounded-xl border border-[#dce3ed] px-6 py-3.5 font-bold text-[#263149]"
              >
                만세력 화면으로 돌아가기
              </Link>
            </div>
          </section>
        )}

        {!loading && fortune && (
          <>
            {/* 상단 핵심 운세 카드 */}
            <section className="grid min-h-[220px] items-center gap-7 rounded-[24px] border border-[#e4e8f1] bg-white px-7 py-8 shadow-[0_10px_35px_rgba(35,47,73,.04)] sm:px-10 lg:grid-cols-[180px_1fr] lg:gap-10">
              
              {/* 상단 종합 점수 원 : 숫자가 정중앙에 48px 크기로 크게 노출, 원 안 부가설명 문구 제거 */}
              <div className="flex justify-center">
                <div
                  className="grid h-[150px] w-[150px] shrink-0 place-items-center rounded-full p-[14px]"
                  style={{
                    background: `conic-gradient(#3a5bbf 0deg ${(Math.max(0, Math.min(100, Number(fortune.overall?.score) || 0)) / 100) * 360}deg, #e9edf6 0deg 360deg)`,
                  }}
                >
                  <div className="grid h-full w-full place-items-center rounded-full bg-white text-center">
                    <strong className="today-score font-black tracking-[-.05em] text-[#1d2537]">
                      {Number(fortune.overall?.score) || 0}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <p className="today-fortune-label font-extrabold text-[#3a5bbf]">
                  오늘 가장 먼저 읽을 명리학 사주풀이
                </p>
                
                {/* 데스크톱 화면에서 한 줄로 시원하게 표시되는 메인 제목 */}
                <h2 
                   
                   className="today-main-headline mt-3 whitespace-nowrap overflow-hidden text-ellipsis font-black tracking-[-.04em] text-[#1d2537]">
                  {fortune.dailyInsight?.headline || fortune.overall?.title}
                </h2>

                {/* Gemini 사주풀이 상세 내용 그대로 출력 */}
                <p className="today-fortune-lead mt-4 max-w-[1100px] font-normal text-[#414d61]">
                  {fortune.dailyInsight?.scene || fortune.overall?.description}
                </p>

                {fortune.dailyInsight?.keyword && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="today-keyword rounded-full bg-[#eef2ff] px-4 py-2 font-bold text-[#3a5bbf]">
                      #{fortune.dailyInsight.keyword}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* 행운 포인트 (색 1개, 숫자 1개, 추천활동 1개) */}
            <section className="mt-6 grid gap-4">
              <article className="rounded-[16px] border border-[#e0e5ed] bg-white px-7 py-6 shadow-[0_4px_14px_rgba(26,46,84,.045)]">
              <h2 className="today-section-title font-black tracking-[-.03em] text-[#0f172a]">
                오늘의 행운 포인트
              </h2>
                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  <LuckyItem
                    icon={
                      <span className="today-lucky-icon grid h-10 w-10 place-items-center rounded-full bg-[#e9f1ff] text-[#2563eb]">
                        ●
                      </span>
                    }
                    label="행운의 색"
                  >
                    {fortune.luckyColor || "-"}
                  </LuckyItem>
                  <LuckyItem
                    icon={
                      <span className="today-lucky-number-icon grid h-10 w-10 place-items-center rounded-full bg-[#245bca] font-bold text-white">
                        {fortune.luckyNumbers?.[0] ?? "-"}
                      </span>
                    }
                    label="행운의 숫자"
                  >
                    {fortune.luckyNumbers?.[0] ?? "-"}
                  </LuckyItem>
                  <LuckyItem
                    icon={
                      <span className="today-lucky-check-icon grid h-10 w-10 place-items-center rounded-full bg-[#eaf7f1] font-bold text-[#168456]">
                        ✓
                      </span>
                    }
                    label="추천 활동"
                  >
                    {fortune.recommendedActivity || "-"}
                  </LuckyItem>
                </div>
              </article>
            </section>

            {/* 분야별 상세 운세 섹션 */}
            <section className="mt-6 rounded-[24px] border border-[#e3e8f0] bg-[#f8f9fc] px-6 py-7 shadow-[0_8px_28px_rgba(31,47,78,.035)] sm:px-8 sm:py-9">
              <div className="mb-6">
                <p className="today-section-eyebrow font-extrabold tracking-[.12em] text-[#3a5bbf]">
                  TODAY'S FORTUNE
                </p>
                <h2 className="today-section-heading mt-2 font-black tracking-[-.035em] text-[#172033]">
                  분야별 명리학 세부 운세
                </h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {DETAIL_SECTIONS.map((item) => (
                  <FortuneDetailCard
                    key={item.key}
                    section={fortune[item.key]}
                    label={item.label}
                    eyebrow={item.eyebrow}
                    color={item.color}
                    featured={item.key === "overall"}
                  />
                ))}
              </div>

              {/* 피드백 영역 */}
              <div className="mt-8 border-t border-[#dde3ec] pt-8">
                <p className="today-feedback-title font-extrabold tracking-[-.025em] text-[#172033]">
                  오늘의 운세 해석이 도움이 되었나요?
                </p>
                {!feedbackLocked && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={feedbackStatus === "saving"}
                      onClick={() => {
                        setFeedbackChoice(true);
                        setHelpfulTopics([]);
                        setIssueTypes([]);
                        setFeedbackStatus("");
                      }}
                      className={`today-feedback-button rounded-xl px-6 py-3.5 font-bold disabled:opacity-60 ${
                        feedbackChoice === true
                          ? "bg-[#2563eb] text-white"
                          : "border border-[#d5dce7] bg-white text-[#354157]"
                      }`}
                    >
                      도움됐어요
                    </button>
                    <button
                      type="button"
                      disabled={feedbackStatus === "saving"}
                      onClick={() => {
                        setFeedbackChoice(false);
                        setHelpfulTopics([]);
                        setIssueTypes([]);
                        setFeedbackStatus("");
                      }}
                      className={`today-feedback-button rounded-xl px-6 py-3.5 font-bold disabled:opacity-60 ${
                        feedbackChoice === false
                          ? "bg-[#2563eb] text-white"
                          : "border border-[#d5dce7] bg-white text-[#354157]"
                      }`}
                    >
                      아쉬워요
                    </button>
                  </div>
                )}
                {!feedbackLocked && feedbackChoice === true && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {HELPFUL_OPTIONS.map(([value, label]) => (
                      <label
                        key={value}
                        className="today-feedback-option cursor-pointer rounded-full border border-[#d8e0eb] bg-white px-5 py-3 font-medium text-[#596579]"
                      >
                        <input
                          type="checkbox"
                          disabled={feedbackStatus === "saving"}
                          className="mr-2"
                          checked={helpfulTopics.includes(value)}
                          onChange={() => {
                            const next = [value];
                            setHelpfulTopics(next);
                            void submitFeedback({
                              choice: true,
                              nextHelpfulTopics: next,
                              nextIssueTypes: [],
                            });
                          }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                )}
                {!feedbackLocked && feedbackChoice === false && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {ISSUE_OPTIONS.map(([value, label]) => (
                      <label
                        key={value}
                        className="today-feedback-option cursor-pointer rounded-full border border-[#d8e0eb] bg-white px-5 py-3 font-medium text-[#596579]"
                      >
                        <input
                          type="checkbox"
                          disabled={feedbackStatus === "saving"}
                          className="mr-2"
                          checked={issueTypes.includes(value)}
                          onChange={() => {
                            const next = [value];
                            setIssueTypes(next);
                            void submitFeedback({
                              choice: false,
                              nextHelpfulTopics: [],
                              nextIssueTypes: next,
                            });
                          }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                )}
                {feedbackStatus === "rewarded" && (
                  <p className="today-feedback-status mt-4 rounded-xl bg-[#effaf5] px-6 py-4 font-bold text-[#168456]">
                    ✓ 소중한 평가 감사합니다. 1포인트 적립되었습니다.
                  </p>
                )}
                {feedbackLocked && feedbackStatus !== "rewarded" && (
                  <p className="today-feedback-status mt-4 rounded-xl bg-white px-6 py-4 font-bold text-[#596579]">
                    ✓ 오늘의 운세 평가를 완료했습니다.
                  </p>
                )}
              </div>
            </section>

            <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-[#7ea1ff] bg-gradient-to-r from-[#f3f6ff] to-[#f6f5ff] px-8 py-5">
              <div className="flex items-center gap-4">
                <span className="today-tomorrow-icon" aria-hidden="true">
                  🗓️
                </span>
                <div>
                  <strong className="today-tomorrow-title font-extrabold tracking-[-.025em] text-[#151f3b]">
                    내일의 운세는 자정부터 확인할 수 있어요
                  </strong>
                  <p className="today-tomorrow-body mt-1 text-[#667085]">
                    한국 시간 기준으로 날짜가 바뀐 뒤 확인할 수 있습니다.
                  </p>
                </div>
              </div>
              <span className="today-tomorrow-badge inline-flex h-11 items-center gap-2 rounded-lg border border-[#d5dbe6] bg-white/80 px-6 font-extrabold text-[#788296]">
                🔒 자정에 열려요
              </span>
            </section>

            <p className="today-disclaimer mx-auto mt-6 max-w-4xl text-center text-[#788296]">
              이 운세는 만세력 계산에 따른 명리학적 경향을 일상 언어로 풀어낸 참고 정보입니다.
              건강·투자·법률·시험 등 중요한 결정은 해당 분야의 객관적인 정보와 전문가 판단을 함께 확인해 주세요.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
