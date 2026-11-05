"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

type PlanAnalysisItem = {
  task: string;
  reason: string;
};

type PlanAnalysis = {
  summary: string;
  favorable: PlanAnalysisItem[];
  caution: PlanAnalysisItem[];
  postpone: PlanAnalysisItem[];
  recommendedOrder: string[];
};

type MatchedPlanAnalysis = {
  item: PlanAnalysisItem;
  label: string;
  tone: "good" | "care" | "later";
};

type TodayContentView = "today-fortune" | "today-plan" | "today-review" | "today-report";

const LOADING_MESSAGE =
  "오늘의 흐름을 꼼꼼히 살펴 오늘의 운세를 풀이하고 있습니다.";

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

const TODAY_CONTENT_TABS: Array<{
  id: TodayContentView;
  label: string;
  disabled?: boolean;
}> = [
  { id: "today-fortune", label: "오늘의 운세" },
  { id: "today-plan", label: "오늘 일정 점보기" },
  { id: "today-review", label: "운세일기", disabled: true },
  { id: "today-report", label: "운세 리포트", disabled: true },
];

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

function monthParts(dateText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  return { year, month, day };
}

function dateText(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(dateValue: string) {
  const { year, month } = monthParts(dateValue);
  return new Date(year, month, 0).getDate();
}

function shiftMonth(dateValue: string, amount: number) {
  const { year, month, day } = monthParts(dateValue);
  const target = new Date(year, month - 1 + amount, 1);
  const targetYear = target.getFullYear();
  const targetMonth = target.getMonth() + 1;
  const targetDay = Math.min(
    day,
    new Date(targetYear, targetMonth, 0).getDate(),
  );
  return dateText(targetYear, targetMonth, targetDay);
}

function monthTitle(dateValue: string) {
  const { year, month } = monthParts(dateValue);
  return `${year}년 ${month}월`;
}

function selectedDayTitle(dateValue: string, today: string) {
  const { month, day } = monthParts(dateValue);
  return `${month}월 ${day}일${dateValue === today ? " · 오늘" : ""}`;
}

function conciseText(value: unknown, maxLength = 190) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "오늘의 흐름을 차분하게 살펴보세요.";

  const sentences = text.match(/[^.!?。]+[.!?。]?/g) || [text];
  const twoSentences = sentences.slice(0, 2).join(" ").trim();
  if (twoSentences.length <= maxLength) return twoSentences;

  const shortened = twoSentences.slice(0, maxLength);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 90 ? lastSpace : maxLength).trim()}…`;
}

function matchPlanAnalysis(
  analysis: PlanAnalysis | null,
  task: string,
): MatchedPlanAnalysis | null {
  if (!analysis || !task.trim()) return null;

  const normalizedTask = task.replace(/\s+/g, " ").trim();
  const groups: Array<{
    items: PlanAnalysisItem[];
    label: string;
    tone: MatchedPlanAnalysis["tone"];
  }> = [
    {
      items: analysis.favorable,
      label: "오늘 진행하기 좋음",
      tone: "good",
    },
    {
      items: analysis.caution,
      label: "신중하게 진행",
      tone: "care",
    },
    {
      items: analysis.postpone,
      label: "가능하면 다른 날로 조정",
      tone: "later",
    },
  ];

  for (const group of groups) {
    const item = group.items.find((candidate) => {
      const normalizedCandidate = candidate.task.replace(/\s+/g, " ").trim();
      return (
        normalizedCandidate === normalizedTask ||
        normalizedCandidate.includes(normalizedTask) ||
        normalizedTask.includes(normalizedCandidate)
      );
    });
    if (item) return { item, label: group.label, tone: group.tone };
  }

  return null;
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

function FortuneAccordionRow({
  section,
  label,
  color,
  open,
  onToggle,
}: {
  section: FortuneSection;
  label: string;
  color: string;
  open: boolean;
  onToggle: () => void;
}) {
  const goodActions = section.detail?.goodActions || [];
  const avoidActions = section.detail?.avoidActions || [];

  return (
    <article className="border-t border-[#dfe6f0] last:border-b">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="grid w-full grid-cols-[118px_minmax(0,1fr)_28px] items-center gap-4 bg-white px-1 py-5 text-left sm:grid-cols-[180px_minmax(0,1fr)_32px] sm:gap-7 sm:py-6"
      >
        <span className="text-[17px] font-black tracking-[-.025em] text-[#243754] sm:text-[25px]">
          {label}
        </span>
        <span className="min-w-0 truncate text-[15px] font-semibold text-[#66758d] sm:text-[25px]">
          {section.title || label}
        </span>
        <span
          className={`text-center text-[22px] font-bold text-[#2f66df] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ⌄
        </span>
      </button>

      {open && (
        <div className="pb-7 pl-1 pr-1 sm:pb-8 sm:pl-[208px] sm:pr-10">
          <p className="break-keep text-[17px] leading-8 text-[#53627a] sm:text-[25px] sm:leading-[1.75]">
            {section.description ||
              section.advice ||
              "오늘의 흐름을 차분히 살펴보세요."}
          </p>

          {section.detail?.reason && (
            <div className="mt-5 border-l-[3px] border-[#b7c9ee] pl-4">
              <strong className="block text-[16px] font-black text-[#314663] sm:text-[18px]">
                이렇게 풀이했어요
              </strong>
              <p className="mt-2 break-keep text-[16px] leading-8 text-[#66758d] sm:text-[25px] sm:leading-[1.75]">
                {section.detail.reason}
              </p>
            </div>
          )}

          {section.detail?.flow && (
            <p className="mt-5 break-keep text-[16px] leading-8 text-[#66758d] sm:text-[25px] sm:leading-[1.75]">
              {section.detail.flow}
            </p>
          )}

          {(goodActions.length > 0 || avoidActions.length > 0) && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-8">
              <div className="border-t-2 border-[#4d83e8] pt-4">
                <strong className="block text-[16px] font-black text-[#1f5fc5] sm:text-[18px]">
                  하면 좋은 행동
                </strong>
                <p className="mt-2 break-keep text-[16px] leading-8 text-[#53627a] sm:text-[25px] sm:leading-[1.75]">
                  {goodActions.length > 0
                    ? goodActions.join(" · ")
                    : "오늘 정한 일의 우선순위를 차분히 지켜보세요."}
                </p>
              </div>
              <div className="border-t-2 border-[#d5a25b] pt-4">
                <strong className="block text-[16px] font-black text-[#9a6015] sm:text-[18px]">
                  피하면 좋은 행동
                </strong>
                <p className="mt-2 break-keep text-[16px] leading-8 text-[#53627a] sm:text-[25px] sm:leading-[1.75]">
                  {avoidActions.length > 0
                    ? avoidActions.join(" · ")
                    : "확인하지 않은 내용을 서둘러 결론 내리지 마세요."}
                </p>
              </div>
            </div>
          )}

          {section.advice && section.advice !== section.description && (
            <p
              className="mt-6 break-keep border-t border-[#e4e9f1] pt-5 text-[16px] font-semibold leading-8 sm:text-[25px] sm:leading-[1.75]"
              style={{ color }}
            >
              {section.advice}
            </p>
          )}
        </div>
      )}
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
              <h2 className="today-loading-section-title font-extrabold text-[#1d2537]">
                {section.title}
              </h2>
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
  const [todayTask, setTodayTask] = useState("");
  const [planSaved, setPlanSaved] = useState(false);
  const [activeChartId, setActiveChartId] = useState("");
  const [planAnalysis, setPlanAnalysis] = useState<PlanAnalysis | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");
  const [openFortuneSections, setOpenFortuneSections] = useState<string[]>([
    "overall",
  ]);
  const [fortune, setFortune] = useState<TodayFortune | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [interpretationId, setInterpretationId] = useState("");

  const [, setIntroProfile] = useState<IntroProfile | null>(null);

  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [feedbackChoice, setFeedbackChoice] = useState<boolean | null>(null);
  const [helpfulTopics, setHelpfulTopics] = useState<string[]>([]);
  const [issueTypes, setIssueTypes] = useState<string[]>([]);
  const [feedbackLocked, setFeedbackLocked] = useState(false);
  const [pointBalance, setPointBalance] = useState(0);
  const [streamStatus, setStreamStatus] = useState("");
  const [streamSections, setStreamSections] = useState<StreamedSection[]>([]);
  const [activeTodayView, setActiveTodayView] =
    useState<TodayContentView>("today-plan");
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [taskDraft, setTaskDraft] = useState("");
  const [analyzedPlanText, setAnalyzedPlanText] = useState("");
  const [deletedPlan, setDeletedPlan] = useState<{ text: string; saved: boolean } | null>(null);
  const [savingTaskIndex, setSavingTaskIndex] = useState<number | null>(null);


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

          if (
            chartResponse.ok &&
            chartData?.success &&
            chartData?.entry?.chartId
          ) {
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
        setActiveChartId(String(chartId || ""));
        const profile = activeEntry?.profile || activeEntry?.birthProfile || {};
        const name =
          profile.profileName ||
          profile.profile_name ||
          localChart?.profileName ||
          "";
        const birthDate =
          profile.birthDate ||
          profile.birth_date ||
          localChart?.solarDate ||
          "";
        const birthTime =
          profile.birthTime ||
          profile.birth_time ||
          localChart?.birthTime ||
          "";

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
            throw new Error(
              event.error ||
                "Gemini 운세 생성에 실패했습니다. 다시 시도해 주세요.",
            );
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
          throw new Error(
            "Gemini 운세 생성이 완료되지 않았습니다. 다시 시도해 주세요.",
          );
        }

        setFortune(completedFortune);
        setInterpretationId(nextInterpretationId);
        setLoading(false);

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
    if (!selectedDate || !activeChartId) return;

    const controller = new AbortController();
    setTodayTask("");
    setEditingTaskIndex(null);
    setTaskDraft("");
    setDeletedPlan(null);
    setAnalyzedPlanText("");
    setPlanSaved(false);
    setPlanAnalysis(null);
    setPlanError("");

    void (async () => {
      try {
        const response = await fetch(
          `/api/fortune/today-plan?chartId=${encodeURIComponent(activeChartId)}&date=${encodeURIComponent(selectedDate)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || "오늘의 계획을 불러오지 못했습니다.");
        }
        setTodayTask(String(data?.plan?.planText || ""));
        setPlanAnalysis((data?.analysis as PlanAnalysis) || null);
        setAnalyzedPlanText(String(data?.plan?.planText || ""));
        setPlanSaved(Boolean(data?.plan));
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setTodayTask("");
        setPlanError(
          reason instanceof Error
            ? reason.message
            : "오늘의 계획을 불러오지 못했습니다.",
        );
      }
    })();

    return () => controller.abort();
  }, [selectedDate, activeChartId]);

  useEffect(() => {
    if (!selectedDate) return;

    setOpenFortuneSections(["overall"]);
    const controller = new AbortController();
    void loadFortune(selectedDate, controller.signal);

    return () => controller.abort();
  }, [selectedDate, loadFortune]);

  useEffect(() => {
    const syncTodayView = () => {
      const hash = window.location.hash.replace("#", "");
      const view = hash;
      if (view === "today-review" || view === "today-report") {
        setActiveTodayView("today-plan");
        window.history.replaceState(null, "", "/fortune/today#today-plan");
        return;
      }
      if (TODAY_CONTENT_TABS.some((item) => item.id === view && !item.disabled)) {
        setActiveTodayView(view as TodayContentView);
      }
    };

    syncTodayView();
    window.addEventListener("hashchange", syncTodayView);
    window.addEventListener("popstate", syncTodayView);
    return () => {
      window.removeEventListener("hashchange", syncTodayView);
      window.removeEventListener("popstate", syncTodayView);
    };
  }, []);

  useEffect(() => {
    if (loading || !fortune) return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const isContentView =
      hash === "today-fortune" ||
      TODAY_CONTENT_TABS.some((item) => item.id === hash);
    const timer = window.setTimeout(() => {
      document
        .getElementById(isContentView ? "today-content-tabs" : hash)
        ?.scrollIntoView({ block: "start" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loading, fortune]);

  const today = selectedDate ? seoulToday() : "";
  const todayTaskLines = todayTask.split("\n");

  const normalizedPlan = (text: string) => text.split("\n").map((line) => line.trim()).filter(Boolean).join("\n");
  const planChanged = Boolean(planAnalysis) && normalizedPlan(todayTask) !== normalizedPlan(analyzedPlanText);
  const previouslyAnalyzedTasks = new Set(analyzedPlanText.split("\n").map((line) => line.trim()));

  const beginTaskEdit = (index: number) => {
    setEditingTaskIndex(index);
    setTaskDraft(todayTaskLines[index]);
    setPlanError("");
  };

  const cancelTaskEdit = () => {
    if (planLoading) return;
    if (editingTaskIndex !== null && !todayTaskLines[editingTaskIndex]?.trim()) {
      setTodayTask(todayTaskLines.filter((_, i) => i !== editingTaskIndex).join("\n"));
    }
    setEditingTaskIndex(null);
    setTaskDraft("");
    setPlanError("");
  };

  const saveTaskEdit = async (index: number) => {
    if (planLoading) return;
    if (!taskDraft.trim()) {
      setPlanError("저장할 일정을 입력해 주세요.");
      return;
    }
    const lines = [...todayTaskLines];
    lines[index] = taskDraft.trim();
    const nextValue = lines.filter((line) => line.trim()).join("\n");
    if (nextValue.length > 2000) {
      setPlanError("일정은 전체 2,000자 이내로 작성해 주세요.");
      return;
    }
    setSavingTaskIndex(index);
    const saved = await analyzeTodayPlan(nextValue);
    setSavingTaskIndex(null);
    if (saved) {
      setTodayTask(nextValue);
      setEditingTaskIndex(null);
      setTaskDraft("");
      setDeletedPlan(null);
    }
  };

  const deleteTask = async (index: number) => {
    if (planLoading) return;
    const previous = { text: todayTask, saved: planSaved };
    const nextValue = todayTaskLines.filter((_, i) => i !== index).join("\n");
    if (await analyzeTodayPlan(nextValue)) {
      setTodayTask(nextValue);
      setDeletedPlan(previous);
    }
  };

  const undoDelete = async () => {
    if (!deletedPlan || planLoading) return;
    const text = deletedPlan.text;
    if (await analyzeTodayPlan(text)) {
      setTodayTask(text);
      setDeletedPlan(null);
    }
  };

  const addTodayTaskLine = () => {
    if (todayTaskLines.length >= 10) {
      setPlanError("오늘 할 일은 최대 10개까지 작성할 수 있습니다.");
      return;
    }
    const index = todayTaskLines.findIndex((task) => !task.trim());
    if (index >= 0) { beginTaskEdit(index); return; }
    setTodayTask((current) => `${current}\n`);
    setEditingTaskIndex(todayTaskLines.length);
    setTaskDraft("");
    setPlanError("");
  };

  const moveToTodayView = (id: TodayContentView) => {
    if (TODAY_CONTENT_TABS.find((item) => item.id === id)?.disabled) return;
    setActiveTodayView(id);
    window.history.replaceState(null, "", `/fortune/today#${id}`);
    window.dispatchEvent(new Event("hashchange"));
  };

  const showPreviousMonth = () =>
    setSelectedDate((date) => shiftMonth(date, -1));
  const showNextMonth = () => {
    setSelectedDate((date) => {
      const next = shiftMonth(date, 1);
      return next > today ? today : next;
    });
  };

  const analyzeTodayPlan = async (nextText: string): Promise<boolean> => {
    const planText = nextText.trim();
    if (!selectedDate || !activeChartId || !fortune) {
      setPlanError("운세 정보를 불러온 뒤 다시 저장해 주세요.");
      return false;
    }

    setPlanLoading(true);
    setPlanError("");
    setPlanSaved(false);

    try {
      if (!planText) {
        const response = await fetch(`/api/fortune/today-plan?chartId=${encodeURIComponent(activeChartId)}&date=${selectedDate}`, { method: "DELETE" });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "일정 삭제를 저장하지 못했습니다.");
        setPlanAnalysis(null);
        setAnalyzedPlanText("");
        setDeletedPlan(null);
        setPlanSaved(true);
        return true;
      }
      const response = await fetch("/api/fortune/today-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chartId: activeChartId,
          date: selectedDate,
          planText,
          fortuneContext: {
            dayPillar: fortune.dayPillar,
            headline: fortune.dailyInsight?.headline || fortune.overall?.title,
            reason:
              fortune.dailyInsight?.reason || fortune.overall?.description,
            prescription:
              fortune.dailyInsight?.prescription || fortune.overall?.advice,
            cautions: fortune.cautions || [],
            timeFlow: fortune.timeFlow || [],
          },
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "오늘의 계획을 분석하지 못했습니다.");
      }
      setPlanAnalysis(data.analysis as PlanAnalysis);
      setAnalyzedPlanText(planText);
      setDeletedPlan(null);
      setPlanSaved(true);
      return true;
    } catch (reason) {
      setPlanError(
        reason instanceof Error
          ? reason.message
          : "오늘의 계획을 분석하지 못했습니다.",
      );
      return false;
    } finally {
      setPlanLoading(false);
    }
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
      if (!response.ok || !data?.success)
        throw new Error(data?.error || "평가를 저장하지 못했습니다.");
      setFeedbackLocked(true);
      setPointBalance(Number(data.pointBalance || 0));
      setFeedbackStatus(data.alreadyEvaluated ? "already" : "rewarded");
    } catch (reason) {
      setFeedbackStatus(
        reason instanceof Error
          ? reason.message
          : "평가를 저장하지 못했습니다.",
      );
    }
  };

  const selectedMonth = selectedDate ? monthParts(selectedDate) : null;
  const calendarDates = selectedDate
    ? Array.from({ length: daysInMonth(selectedDate) }, (_, index) =>
        dateText(selectedMonth!.year, selectedMonth!.month, index + 1),
      )
    : [];
  const currentMonthKey = today ? today.slice(0, 7) : "";
  const selectedMonthKey = selectedDate ? selectedDate.slice(0, 7) : "";
  const nextMonthDisabled = Boolean(
    currentMonthKey && selectedMonthKey >= currentMonthKey,
  );

  return (
    <main className="today-fortune-page min-h-full bg-white">
      <div className="mx-auto w-full max-w-[1640px] px-5 pb-10 pt-10 sm:px-8 lg:px-10 lg:pt-14">
        <header id="today-compass-top" className="mb-10">
          <h1 className="break-keep text-[36px] font-black tracking-[-0.045em] text-[#0d2857] sm:text-[46px] lg:text-[58px]">
            오늘의 나침반
          </h1>
          <p className="mt-3 break-keep text-[18px] leading-8 text-[#596b87] sm:text-[22px] lg:text-[25px]">
            하루의 흐름을 읽고, 계획하고, 기록해 보세요.
          </p>
        </header>

        <section
          id="today-map"
          className="scroll-mt-24 border-b border-[#dce3ee] pb-9"
        >
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={showPreviousMonth}
              disabled={planLoading}
              className="grid h-11 w-11 place-items-center rounded-full border border-[#d9e1ed] text-[#30415f] transition hover:border-[#7ca2ee] hover:text-[#1760ee]"
              aria-label="이전 달"
            >
              <ArrowIcon className="h-5 w-5 rotate-180" />
            </button>
            <h2 className="min-w-[170px] text-[25px] font-extrabold tracking-[-0.035em] text-[#102c5c] sm:text-[30px]">
              {selectedDate ? monthTitle(selectedDate) : "날짜 확인 중"}
            </h2>
            <button
              type="button"
              onClick={showNextMonth}
              disabled={nextMonthDisabled || planLoading}
              className="grid h-11 w-11 place-items-center rounded-full border border-[#d9e1ed] text-[#30415f] transition hover:border-[#7ca2ee] hover:text-[#1760ee] disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="다음 달"
            >
              <ArrowIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(seoulToday())}
              disabled={planLoading}
              className="ml-1 h-11 rounded-full border border-[#7da1ef] px-6 text-[16px] font-bold text-[#1760ee] transition hover:bg-[#f2f6ff]"
            >
              오늘로 이동
            </button>
          </div>

          <div className="mt-8 overflow-x-auto pb-2 [scrollbar-width:thin]">
            <div className="relative grid min-w-[1060px] grid-flow-col auto-cols-fr items-start px-1 pt-6">
              <div className="pointer-events-none absolute left-4 right-4 top-[68px] h-px bg-[#b9cdf1]" />
              {calendarDates.map((dateValue) => {
                const day = monthParts(dateValue).day;
                const active = dateValue === selectedDate;
                const isRealToday = dateValue === today;
                const disabled = Boolean(today && dateValue > today);

                return (
                  <button
                    key={dateValue}
                    type="button"
                    disabled={disabled || planLoading}
                    onClick={() => setSelectedDate(dateValue)}
                    className="group relative z-10 flex min-w-[34px] flex-col items-center disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label={`${dateValue}${isRealToday ? " 오늘" : ""}`}
                    aria-current={active ? "date" : undefined}
                  >
                    <span
                      className={`absolute -top-6 rounded-full px-2.5 py-1 text-[12px] font-extrabold text-white ${isRealToday ? "bg-[#ff914d]" : "invisible"}`}
                    >
                      오늘
                    </span>
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-full text-[15px] font-extrabold transition ${active ? "bg-[#2f66df] text-white shadow-[0_7px_18px_rgba(47,102,223,.25)]" : "bg-white text-[#213655] group-hover:bg-[#eef4ff] group-hover:text-[#1760ee]"}`}
                    >
                      {day}
                    </span>
                    <span
                      className={`mt-2 h-2 w-2 rounded-full border-2 border-white ${active ? "bg-[#2f66df]" : "bg-[#b7c7df]"}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {!loading && fortune && (
              <section className="mt-6 border-y border-[#dce3ee] py-5 sm:py-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-5">
                  <h2 className="border-l-[4px] border-[#3978ed] pl-4 text-[21px] font-black tracking-[-.03em] text-[#17345f] sm:text-[25px]">
                    오늘의 행운 포인트
                  </h2>
                  <p className="text-[13px] text-[#8794a8] sm:text-[25px]">
                    오늘의 흐름을 돕는 가벼운 참고 정보입니다.
                  </p>
                </div>

                <div className="mt-4">
                  <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)] items-center gap-x-3 gap-y-1 sm:grid-cols-[36px_auto_minmax(0,1fr)]">
                    <span
                      className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#fff4ec] text-[17px] font-black text-[#ef8a4c]"
                      aria-hidden="true"
                    >
                      ✦
                    </span>
                    <span className="whitespace-nowrap text-[14px] font-bold text-[#7f8ca0] sm:text-[25px]">
                      오늘의 작은 제안
                    </span>
                    <strong className="col-start-2 break-keep text-[17px] leading-[1.5] tracking-[-.025em] text-[#17345f] sm:col-start-auto sm:text-[25px]">
                      {fortune.recommendedActivity || "-"}
                    </strong>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-y-2 border-t border-[#e1e7f0] pt-2.5 text-[#17345f] sm:ml-12">
                    <div className="flex items-center gap-2 pr-5 sm:pr-7">
                      <span className="text-[13px] font-semibold text-[#8794a8] sm:text-[25px]">
                        행운의 색
                      </span>
                      <span
                        className="h-4 w-4 rounded-full bg-[#d7bd91]"
                        aria-hidden="true"
                      />
                      <strong className="text-[16px] sm:text-[25px]">
                        {fortune.luckyColor || "-"}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2 border-l border-[#dce3ee] pl-5 sm:pl-7">
                      <span className="text-[13px] font-semibold text-[#8794a8] sm:text-[25px]">
                        행운의 숫자
                      </span>
                      <strong className="text-[19px] text-[#2f66df] sm:text-[25px]">
                        {fortune.luckyNumbers?.[0] ?? "-"}
                      </strong>
                    </div>
                  </div>
                </div>
              </section>

          )}
        </section>

        {loading && (
          <LoadingState status={streamStatus} sections={streamSections} />
        )}

        {!loading && error && (
          <section className="rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
            <h2 className="today-error-title font-extrabold text-red-600">
              오늘의 운세를 불러오지 못했습니다
            </h2>
            <p className="today-error-body mt-3 break-words text-[#5c6678]">
              {error}
            </p>
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
            <section
              className="scroll-mt-24 py-8 sm:py-10"
              aria-labelledby="today-flow-title"
            >
              <h2 className="text-[28px] font-black tracking-[-0.04em] text-[#102c5c] sm:text-[34px]">
                {selectedDayTitle(selectedDate, today)}
              </h2>

              <div className="mt-7 border-b border-[#dce3ee] pb-7">
                <p className="border-l-[4px] border-[#3d7af0] pl-4 text-[18px] font-extrabold text-[#17345f] sm:text-[21px]">
                  오늘의 핵심 흐름
                </p>
                <h3
                  id="today-flow-title"
                  className="mt-4 max-w-[1280px] break-keep text-[28px] font-black leading-[1.35] tracking-[-0.045em] text-[#0d2b5c] sm:text-[38px] lg:text-[46px]"
                >
                  {fortune.dailyInsight?.headline || fortune.overall?.title}
                </h3>
                <div className="mt-6 grid gap-4 text-[17px] font-semibold text-[#314663] sm:grid-cols-3 sm:text-[19px]">
                  <p className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full bg-[#9ed9ff]" />
                    {Number(fortune.workStudy?.score || 0) >= 70
                      ? "집중력 높음"
                      : "집중은 천천히"}
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full bg-[#ffc777]" />
                    {Number(fortune.love?.score || 0) >= 70
                      ? "대화 흐름 좋음"
                      : "대화는 천천히"}
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full bg-[#aeb8ff]" />
                    {Number(fortune.wealth?.score || 0) >= 70
                      ? "결정에 힘이 실려요"
                      : "결정은 신중하게"}
                  </p>
                </div>
              </div>
            </section>

            <nav
              id="today-content-tabs"
              className="scroll-mt-24 mb-8 rounded-2xl border border-[#e0e7f3] bg-[#f4f7fc] p-2 sm:p-2.5"
              aria-label="오늘의 나침반 세부 메뉴"
            >
              <p className="mb-2 flex items-center justify-between px-2 pt-1 text-xs font-medium text-[#61728e] lg:hidden"><span>원하는 메뉴를 선택하세요</span><span>좌우로 밀어보세요 ↔</span></p>
              <div className="overflow-x-auto pb-1 [scrollbar-width:thin] [scrollbar-color:#a8bde8_#e8eef8]">
              <div role="tablist" aria-label="오늘의 나침반" className="grid min-w-[680px] grid-cols-4 gap-2">
                {TODAY_CONTENT_TABS.map((item) => {
                  const active = activeTodayView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={item.disabled}
                      aria-disabled={item.disabled || undefined}
                      onClick={() => moveToTodayView(item.id)}
                      className={`relative min-h-[56px] rounded-xl px-4 py-3 text-center text-[16px] font-bold tracking-[-.025em] transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2862e3] sm:min-h-[64px] sm:text-[20px] ${
                        active
                          ? "bg-[#2e63df] text-white shadow-[0_4px_12px_rgba(46,99,223,.24)]"
                          : item.disabled ? "cursor-not-allowed bg-[#eef1f6] text-[#8a97aa]" : "bg-white text-[#526580] hover:bg-[#e6eeff] hover:text-[#245fc8]"
                      }`}
                      role="tab"
                      tabIndex={active ? 0 : -1}
                      onKeyDown={(event) => {
                        const enabledTabs = TODAY_CONTENT_TABS.filter((tab) => !tab.disabled);
                        const index = enabledTabs.findIndex((tab) => tab.id === item.id);
                        const nextIndex = event.key === "ArrowRight"
                          ? (index + 1) % enabledTabs.length
                          : event.key === "ArrowLeft"
                            ? (index - 1 + enabledTabs.length) % enabledTabs.length
                            : event.key === "Home" ? 0
                              : event.key === "End" ? enabledTabs.length - 1 : -1;
                        if (nextIndex < 0) return;
                        event.preventDefault();
                        const next = enabledTabs[nextIndex];
                        moveToTodayView(next.id);
                        document.getElementById(`${next.id}-tab`)?.focus({ preventScroll: true });
                      }}
                      id={`${item.id}-tab`}
                      aria-controls={item.id}
                      aria-selected={active}
                    >
                      {item.label}
                      {item.disabled && <span className="ml-2 inline-block rounded-full bg-[#f0f2f6] px-2 py-0.5 text-[12px] font-semibold text-[#8996a9] sm:text-[14px]">준비 중</span>}
                    </button>
                  );
                })}
              </div>
              </div>
            </nav>

            <div
              id="today-plan"
              role="tabpanel"
              aria-labelledby="today-plan-tab"
              hidden={activeTodayView !== "today-plan"}
            >
              <section
                className="scroll-mt-24 border-b border-[#dce3ee] pb-10"
              >
                <h2 className="border-l-[4px] border-[#3978ed] pl-4 text-[22px] font-black text-[#17345f] sm:text-[28px]">
                  오늘 일정 점보기
                </h2>
                <p className="mt-3 break-keep text-[17px] leading-8 text-[#66758d] sm:text-[20px]">
                  일정을 입력하고 적용을 누르면 오른쪽에 점보기 결과가 나옵니다.
                  다른 일정의 결과는 그대로 유지됩니다.
                </p>
                {deletedPlan && (
                  <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#edf3ff] px-5 py-4 text-[17px] text-[#245fc8]">
                    <span>일정을 목록에서 삭제했습니다.</span>
                    <button type="button" disabled={planLoading || editingTaskIndex !== null} onClick={() => void undoDelete()} className="rounded-lg border border-[#aac2ef] bg-white px-4 py-2 font-extrabold disabled:opacity-40">삭제 되돌리기</button>
                  </div>
                )}
                {planAnalysis && !planChanged && (
                  <p className="mt-6 border-y border-[#dce3ee] py-5 break-keep text-[18px] font-semibold leading-8 text-[#40536f] sm:text-[25px] sm:leading-[1.65]">
                    {planAnalysis.summary}
                  </p>
                )}

                <div className="mt-6 overflow-hidden rounded-[18px] border border-[#dbe3ef] bg-white shadow-[0_12px_30px_rgba(28,52,91,.06)]">
                  <div className="hidden grid-cols-[42%_58%] border-b border-[#dfe6f0] bg-[#f8faff] md:grid">
                    <div className="px-7 py-4 text-[18px] font-black text-[#17345f]">
                      오늘 할 일
                    </div>
                    <div className="border-l border-[#dfe6f0] px-7 py-4 text-[18px] font-black text-[#17345f]">
                      오늘의 흐름 분석
                    </div>
                  </div>

                  {todayTaskLines.map((task, index) => {
                    const matched = previouslyAnalyzedTasks.has(task.trim()) ? matchPlanAnalysis(planAnalysis, task) : null;
                    const editing = editingTaskIndex === index || !task.trim();
                    const toneClass =
                      matched?.tone === "good"
                        ? "bg-[#edf8f3] text-[#177a55]"
                        : matched?.tone === "later"
                          ? "bg-[#f7f1fb] text-[#73548f]"
                          : "bg-[#fff7e9] text-[#a56014]";

                    return (
                      <div
                        key={index}
                        className="grid border-t border-[#e2e7ef] first:border-t-0 md:grid-cols-[42%_58%]"
                      >
                        <div className="flex items-start gap-3 px-5 py-6 sm:px-7 sm:py-7">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#edf3ff] text-[14px] font-black text-[#2864d7]">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            {editing ? (
                              <>
                                <label className="sr-only" htmlFor={`today-task-${index}`}>{index + 1}번째 오늘 일정</label>
                                <input id={`today-task-${index}`} value={editingTaskIndex === index ? taskDraft : task}
                                  disabled={planLoading || (editingTaskIndex !== null && editingTaskIndex !== index)}
                                  onChange={(event) => { setEditingTaskIndex(index); setTaskDraft(event.target.value); setPlanError(""); }}
                                  onKeyDown={(event) => {
                                    if (event.nativeEvent.isComposing) return;
                                    if (event.key === "Enter") { event.preventDefault(); void saveTaskEdit(index); }
                                    if (event.key === "Escape") { cancelTaskEdit(); }
                                  }}
                                  placeholder="오늘 일정을 적어보세요"
                                  className="w-full rounded-lg border border-[#9dbbeb] bg-[#f9fbff] px-3 py-2 text-[20px] font-bold leading-[1.55] text-[#17345f] outline-none focus:ring-2 focus:ring-[#bcd1f7] sm:text-[25px]" />
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button type="button" disabled={planLoading || editingTaskIndex !== index} onClick={() => void saveTaskEdit(index)} className="min-h-10 rounded-lg bg-[#2f66df] px-4 py-2 text-[16px] font-bold text-white disabled:opacity-40">{savingTaskIndex === index ? "적용·점보기 중…" : "적용"}</button>
                                  {editingTaskIndex === index && <button type="button" disabled={planLoading} onClick={() => {cancelTaskEdit();}} className="min-h-10 rounded-lg border border-[#d5dfed] px-4 py-2 text-[16px] font-bold text-[#53627a]">취소</button>}
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="break-words text-[20px] font-extrabold leading-[1.55] tracking-[-.03em] text-[#17345f] sm:text-[25px]">{task}</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button type="button" disabled={planLoading || editingTaskIndex !== null} onClick={() => beginTaskEdit(index)} className="min-h-10 rounded-lg border border-[#c6d7f2] bg-[#f4f8ff] px-4 py-2 text-[16px] font-bold text-[#245fc8] disabled:opacity-40" aria-label={`${task} 수정`}>수정</button>
                                  <button type="button" disabled={planLoading || editingTaskIndex !== null} onClick={() => deleteTask(index)} className="min-h-10 rounded-lg border border-[#e8d5d2] px-4 py-2 text-[16px] font-bold text-[#b15b50] disabled:opacity-40" aria-label={`${task} 삭제`}>삭제</button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div
                          id={index === 0 ? "today-plan-analysis" : undefined}
                          className="scroll-mt-24 border-t border-dashed border-[#dfe6f0] px-5 py-6 sm:px-7 sm:py-7 md:border-l md:border-t-0 md:border-dashed"
                        >
                          {savingTaskIndex === index ? (
                            <p role="status" aria-live="polite" className="text-[20px] leading-8 text-[#2f66df]">일정을 저장하고 흐름을 살펴보고 있어요…</p>
                          ) : matched ? (
                            <>
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[15px] font-black sm:text-[17px] ${toneClass}`}
                              >
                                <span className="h-2 w-2 rounded-full bg-current" />
                                {matched.label}
                              </span>
                              {editing && <p className="mt-3 text-[15px] font-semibold text-[#8b601e]">수정 중입니다. 아래 내용은 저장 전 일정의 분석입니다.</p>}
                              <p className="mt-4 break-keep text-[20px] leading-[1.65] tracking-[-.025em] text-[#53627a] sm:text-[25px]">
                                {matched.item.reason}
                              </p>
                            </>
                          ) : (
                            <p className="break-keep text-[18px] leading-8 text-[#8996a9] sm:text-[21px]">
                              {task.trim()
                                ? "적용을 누르면 이 일정의 점보기 결과가 여기에 표시됩니다."
                                : "일정을 입력한 뒤 적용을 눌러주세요."}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  <p role="status" className="text-[14px] text-[#7b8799] sm:text-[16px]">
                    {todayTask.length.toLocaleString()} / 2,000자
                    {planLoading ? " · 저장 처리 중입니다" : editingTaskIndex !== null ? " · 입력 후 적용을 눌러주세요" : planSaved ? " · 저장되었습니다" : " · 일정을 추가해 주세요"}
                  </p>
                  <button type="button" onClick={addTodayTaskLine}
                    disabled={planLoading || editingTaskIndex !== null}
                    className="ml-auto inline-flex min-h-14 items-center gap-2 rounded-[10px] bg-[#2f66df] px-8 text-[18px] font-extrabold text-white shadow-[0_8px_18px_rgba(47,102,223,.16)] hover:bg-[#2459ca] disabled:cursor-not-allowed disabled:opacity-40">
                    <span aria-hidden="true">＋</span> 일정 추가하기
                  </button>
                </div>

                {planError && (
                  <p className="mt-4 rounded-[10px] bg-[#fff4f1] px-4 py-3 text-[15px] font-semibold text-[#b94b35] sm:text-[17px]">
                    {planError}
                  </p>
                )}
              </section>


            </div>

            {/* 분야별 상세 운세 섹션 */}
            <section
              id="today-fortune"
              role="tabpanel"
              aria-labelledby="today-fortune-tab"
              hidden={activeTodayView !== "today-fortune"}
              className="scroll-mt-24 border-b border-[#dce3ee] bg-white pb-8 sm:pb-10"
            >
              <div className="scroll-mt-24 mb-5">
                <h2 className="mt-2 break-keep text-[28px] font-black tracking-[-.04em] text-[#172f57] sm:text-[34px]">
                  오늘의 운세
                </h2>
                <p className="mt-3 text-[16px] leading-7 text-[#66758d] sm:text-[18px]">
                  궁금한 항목을 누르면 기존의 자세한 풀이가 펼쳐집니다.
                </p>
              </div>

              <div>
                {DETAIL_SECTIONS.map((item) => (
                  <FortuneAccordionRow
                    key={item.key}
                    section={fortune[item.key]}
                    label={item.label}
                    color={item.color}
                    open={openFortuneSections.includes(item.key)}
                    onToggle={() =>
                      setOpenFortuneSections((current) =>
                        current.includes(item.key)
                          ? current.filter((key) => key !== item.key)
                          : [...current, item.key],
                      )
                    }
                  />
                ))}
              </div>

              {/* 피드백 영역 */}
              <div
                id="today-feedback"
                className="scroll-mt-24 mt-8 border-t border-[#dde3ec] pt-8"
              >
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
              이 운세는 만세력 계산에 따른 명리학적 경향을 일상 언어로 풀어낸
              참고 정보입니다. 건강·투자·법률·시험 등 중요한 결정은 해당 분야의
              객관적인 정보와 전문가 판단을 함께 확인해 주세요.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
