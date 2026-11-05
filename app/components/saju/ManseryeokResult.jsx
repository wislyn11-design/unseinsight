"use client";


import { useEffect, useMemo, useRef, useState } from "react";

import {
  createStoredSajuChart,
  persistActiveSajuChart,
  saveActiveSajuChart,
  savePendingFortunePath,
} from "../../lib/saju/chart-storage";

import SajuTable from "./SajuTable";
import Daeun from "./Daeun";
import SeunSinsalView from "./SeunSinsalView";
import WolunSinsalView from "./WolunSinsalView";
import AIResult from "./AIResult";
import { enrichDaeunSinsal } from "../../lib/saju/transit-sinsal-adapter";


function safeNextPath(value) {
  if (
    typeof value === "string" &&
    value.startsWith("/fortune/") &&
    !value.startsWith("//")
  ) {
    return value;
  }

  return "/home";
}

function destinationName(path) {
  const names = {
    "/fortune/today": "오늘의 운세",
    "/fortune/today#today-fortune": "오늘의 운세",
    "/fortune/today#today-plan": "오늘 일정 점보기",
    "/fortune/manseryeok": "만세력",
    "/fortune/saju": "사주총평",
    "/fortune/wealth": "재물운",
    "/fortune/love": "연애운",
    "/fortune/compatibility": "궁합",
    "/fortune/tojeong": "토정비결",
  };

  return names[path] || "운세 서비스";
}

export function ManseryeokResult({
  data,
  currentUser = null,
  nextPath = "/home",
  onReset,
  onRequireLogin,
}) {
  
  const [view, setView] = useState("reading");
  const previousViewRef = useRef("reading");
  const readingScrollRef = useRef(0);
  const chartHeadingRef = useRef(null);
  const chartButtonRef = useRef(null);

  useEffect(() => {
    if (previousViewRef.current === view) return;
    previousViewRef.current = view;
    const frame = window.requestAnimationFrame(() => {
      if (view === "chart") {
        chartHeadingRef.current?.focus({ preventScroll: true });
        chartHeadingRef.current?.scrollIntoView({ block: "start" });
      } else {
        chartButtonRef.current?.focus({ preventScroll: true });
        window.scrollTo({ top: readingScrollRef.current, behavior: "instant" });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [view]);

  const openChart = () => {
    readingScrollRef.current = window.scrollY;
    setView("chart");
  };

  const [saju, setSaju] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [aiInterpretation, setAiInterpretation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const savedChartKeyRef = useRef("");
  const chartSavePromiseRef = useRef(null);
  const redirectedRef = useRef(false);
  const [chartSaving, setChartSaving] = useState(false);
  const [chartSaveError, setChartSaveError] = useState("");
  const [chartSaveNotice, setChartSaveNotice] = useState("");
  const destination = useMemo(() => safeNextPath(nextPath), [nextPath]);
  useEffect(() => {
    const fetchSaju = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/saju", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          setSaju(enrichDaeunSinsal(result.saju, data?.gender));
        } else {
          setError(result.error || "계산 중 오류가 발생했습니다.");
        }
      } catch {
        setError("서버와 통신할 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (data) fetchSaju();
  }, [data]);

  const enrichedSaju = useMemo(() => {
    if (!saju || !data) return null;

    return {
      ...saju,
      profileName: data.profileName || "내 사주",
      gender: data.gender === "여" ? "여성" : "남성",
      birthTime: data.hourInput
        ? `${data.hourInput.slice(0, 2)}:${data.hourInput.slice(2)}`
        : "",
      solarDate: saju.solarDate,
      lunarDate: saju.lunarDate,
      lunarIsLeap: saju.lunarIsLeap,
    };
  }, [saju, data]);

  useEffect(() => {
    if (!saju || !data) return;

    const chartKey = JSON.stringify({
      year: saju.year,
      month: saju.month,
      day: saju.day,
      hour: saju.hour,
      yearInput: data.year,
      monthInput: data.month,
      dayInput: data.day,
      hourInput: data.hourInput,
    });

    if (savedChartKeyRef.current === chartKey) return;
    savedChartKeyRef.current = chartKey;

    const saveCalculatedChart = async () => {
      try {
        setChartSaving(true);
        setChartSaveError("");
        setChartSaveNotice("");
        const entry = createStoredSajuChart(saju, data);
        saveActiveSajuChart(entry);

        // 비로그인 사용자는 만세력 결과를 먼저 충분히 확인할 수 있게 합니다.
        // 로그인창은 계산 직후 자동으로 열지 않고, 하단 CTA를 눌렀을 때만 엽니다.
        if (!currentUser) {
          return;
        }

        const savePromise = persistActiveSajuChart(entry);
        chartSavePromiseRef.current = savePromise;
        const saveResult = await savePromise;

        if (!saveResult.saved) {
          setChartSaveNotice("로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.");
          return;
        }

        // 운세 서비스는 로그인 사용자의 DB chartId가 생성된 뒤에만 엽니다.
        if (destination !== "/home" && !redirectedRef.current) {
          redirectedRef.current = true;
          window.location.replace(destination);
        }
      } catch (saveError) {
        savedChartKeyRef.current = "";
        chartSavePromiseRef.current = null;
        setChartSaveError(
          saveError instanceof Error
            ? saveError.message
            : "만세력을 저장하지 못했습니다.",
        );
        console.error("만세력 저장 실패:", saveError);
      } finally {
        setChartSaving(false);
      }
    };

    void saveCalculatedChart();
  }, [saju, data, currentUser, destination]);

  const handleAiRequest = async () => {
    try {
      setAiLoading(true);
      setAiError(null);
      setAiInterpretation("");

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saju: enrichedSaju }),
      });

      if (!response.ok) {
        throw new Error("AI 서버와 연결할 수 없습니다.");
      }

      setAiLoading(false);

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let currentText = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          currentText += decoder.decode(value, { stream: true });
          setAiInterpretation(currentText);
        }
      }
    } catch {
      setAiError("AI 분석 중 통신 오류가 발생했습니다.");
      setAiLoading(false);
    }
  };

  

  const handleGoHome = async (requestedDestination) => {
    if (!saju || !data) return;
    const target = typeof requestedDestination === "string" ? safeNextPath(requestedDestination) : destination;

    try {
      setChartSaving(true);
      setChartSaveError("");
      setChartSaveNotice("");

      const entry = createStoredSajuChart(saju, data);
      saveActiveSajuChart(entry);

      if (!currentUser) {
        savePendingFortunePath(target);
        setChartSaveNotice(
          target === "/home"
            ? "운세 서비스를 이용하려면 로그인해 주세요. 로그인하면 방금 계산한 만세력이 자동으로 저장됩니다."
            : `${destinationName(target)}를 이용하려면 로그인해 주세요. 로그인 후 바로 이어서 볼 수 있습니다.`,
        );
        onRequireLogin?.();
        return;
      }

      const saveResult = await persistActiveSajuChart(entry);

      if (!saveResult.saved) {
        savePendingFortunePath(target);
        setChartSaveNotice("로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.");
        onRequireLogin?.();
        return;
      }

      // 서비스에서 입력 화면으로 안내된 경우에는 원래 선택한 서비스로 돌아갑니다.
      // 직접 입력한 경우에는 무료 해석을 본 뒤 버튼으로 홈에 이동합니다.
      window.location.assign(target);
    } catch (saveError) {
      chartSavePromiseRef.current = null;
      setChartSaveError(
        saveError instanceof Error
          ? saveError.message
          : "만세력을 저장하지 못했습니다. 다시 시도해 주세요.",
      );
      console.error("만세력 저장 실패:", saveError);
    } finally {
      setChartSaving(false);
    }
  };

  
   

  if (loading) {
    return (
      <div className="pt-20 text-center font-bold text-primary">
        운명의 흐름을 읽고 있습니다...
      </div>
    );
  }

  if (error) {
    return <div className="pt-20 text-center text-red-500">{error}</div>;
  }

  if (!saju || !enrichedSaju) return null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1400px] px-4 pb-16 pt-7 sm:px-8 sm:pt-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#2e63df]">나를 알아가는 첫 이야기</p>
          <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-[#152849] sm:text-[36px]">나의 무료 사주풀이</h1>
          <p className="mt-3 text-[15px] leading-7 text-[#53617a]">타고난 성향과 가능성을 쉬운 이야기로 만나보세요.</p>
        </div>
        <button type="button" onClick={onReset} className="min-h-11 px-2 text-sm font-bold text-[#63718a] underline">다시 입력하기</button>
      </div>
      <div style={{ display: view === "reading" ? "grid" : "none" }} className="min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
        <section id="free-saju-reading" aria-label="무료 사주 해석 및 질문" className="min-w-0">
          <AIResult
            saju={enrichedSaju}
            interpretation={aiInterpretation}
            loading={aiLoading}
            error={aiError}
            onRequest={handleAiRequest}
            onRequireLogin={onRequireLogin}
            autoStart
            isActive={view === "reading"}
          />
        </section>
        <aside className="min-w-0 space-y-5">
          <button ref={chartButtonRef} type="button" onClick={openChart} aria-controls="free-reading-chart" aria-expanded={view === "chart"} className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-[#e0e6f1] bg-white p-5 text-left text-base font-bold text-[#152849]">
            <span>내 만세력 자세히 보기</span><span aria-hidden="true">→</span>
          </button>
          <section className="rounded-2xl border border-[#e0e6f1] bg-white p-5 sm:p-6" aria-label="다음 서비스">
            <h2 className="text-[20px] font-bold text-[#152849]">오늘의 흐름도 알아볼까요?</h2>
            <p className="mt-3 text-[15px] leading-7 text-[#53617a]">질문을 모두 사용하지 않아도 다음 서비스를 둘러볼 수 있어요.</p>
            <div className="mt-4 flex flex-col gap-3">
              <button type="button" disabled={chartSaving} onClick={() => handleGoHome("/home")} className="min-h-12 rounded-xl bg-[#2e63df] px-4 py-3 text-left text-[16px] font-bold text-white disabled:opacity-50">전체 서비스 둘러보기 →</button>
            </div>
            {!currentUser && <p className="mt-4 text-[14px] leading-6 text-[#53617a]">무료 풀이는 로그인 없이 볼 수 있어요. 내 풀이 저장과 다음 운세 이용은 로그인 후 이어집니다.</p>}
            {chartSaving && <p role="status" className="mt-3 text-sm text-[#63718a]">만세력을 저장하고 있습니다.</p>}
          </section>
          {chartSaveError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{chartSaveError}</p>}
          {chartSaveNotice && <p role="status" className="rounded-xl bg-[#f2f7ff] p-4 text-sm text-[#2456bd]">{chartSaveNotice}</p>}
        </aside>
      </div>
      <section id="free-reading-chart" aria-label="내 만세력" style={{ display: view === "chart" ? "block" : "none" }} className="mx-auto w-full min-w-0 max-w-[1040px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 ref={chartHeadingRef} tabIndex={-1} className="scroll-mt-24 text-[24px] font-extrabold text-[#152849] sm:text-[30px]">내 만세력</h2>
          <button type="button" onClick={() => setView("reading")} className="min-h-11 rounded-xl border border-[#cdd8ed] bg-white px-4 py-3 text-sm font-bold text-[#2e63df]">← 사주풀이로 돌아가기</button>
        </div>
        <p className="mb-4 text-sm leading-6 text-[#63718a]">무료 풀이와 질문 내용은 그대로 유지됩니다.</p>
            <div className="mt-3 min-w-0"><SajuTable saju={saju} form={data} /></div>
            <p className="mt-4 text-[14px] leading-6 text-[#53617a]">대운·세운·월운 표는 좌우로 밀어서 확인하세요.</p>
            <div className="mt-3 min-w-0 space-y-3">
              <div className="min-w-0 overflow-hidden"><Daeun daeun={saju.daeun} dayGan={saju.day.gan} birthYear={data.year} /></div>
              <div className="min-w-0 overflow-hidden"><SeunSinsalView saju={saju} /></div>
              <div className="min-w-0 overflow-hidden"><WolunSinsalView saju={saju} /></div>
            </div>

        <button type="button" onClick={() => setView("reading")} className="mt-6 min-h-12 rounded-xl bg-[#2e63df] px-5 py-3 text-sm font-bold text-white">← 사주풀이로 돌아가기</button>
      </section>
    </div>
  );
}
