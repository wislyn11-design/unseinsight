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


function FortuneFlowCTA({ onGoHome, isSaving, buttonLabel, requiresLogin }) {
  return (
    <section className="fortune-flow-card" aria-labelledby="fortune-flow-title">
      <div className="fortune-flow-symbol" aria-hidden="true">
        <span className="fortune-flow-orbit fortune-flow-orbit-one" />
        <span className="fortune-flow-orbit fortune-flow-orbit-two" />
        <svg
          className="fortune-flow-star"
          viewBox="0 0 92 92"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="fortune-star-gradient" x1="16" y1="14" x2="78" y2="80">
              <stop stopColor="#45C8E7" />
              <stop offset="0.48" stopColor="#587EED" />
              <stop offset="1" stopColor="#8C63DF" />
            </linearGradient>
          </defs>
          <path
            d="M42.8 13.8c2.5-6.7 12-6.7 14.5 0l3.4 9.2a15.4 15.4 0 0 0 9.1 9.1l9.2 3.4c6.7 2.5 6.7 12 0 14.5l-9.2 3.4a15.4 15.4 0 0 0-9.1 9.1l-3.4 9.2c-2.5 6.7-12 6.7-14.5 0l-3.4-9.2a15.4 15.4 0 0 0-9.1-9.1L21.1 50c-6.7-2.5-6.7-12 0-14.5l9.2-3.4a15.4 15.4 0 0 0 9.1-9.1l3.4-9.2Z"
            fill="url(#fortune-star-gradient)"
          />
          <path
            d="M73.6 8.8c1.1-3 5.4-3 6.5 0l1.3 3.6a6 6 0 0 0 3.6 3.6l3.6 1.3c3 1.1 3 5.4 0 6.5L85 25.1a6 6 0 0 0-3.6 3.6l-1.3 3.6c-1.1 3-5.4 3-6.5 0l-1.3-3.6a6 6 0 0 0-3.6-3.6l-3.6-1.3c-3-1.1-3-5.4 0-6.5l3.6-1.3a6 6 0 0 0 3.6-3.6l1.3-3.6Z"
            fill="#7B6AE6"
          />
          <path
            d="M25.8 17.7c.8-2.1 3.8-2.1 4.6 0l.8 2.1a4.1 4.1 0 0 0 2.4 2.4l2.1.8c2.1.8 2.1 3.8 0 4.6l-2.1.8a4.1 4.1 0 0 0-2.4 2.4l-.8 2.1c-.8 2.1-3.8 2.1-4.6 0l-.8-2.1a4.1 4.1 0 0 0-2.4-2.4l-2.1-.8c-2.1-.8-2.1-3.8 0-4.6l2.1-.8a4.1 4.1 0 0 0 2.4-2.4l.8-2.1Z"
            fill="#62A4EE"
            opacity="0.88"
          />
        </svg>
      </div>

      <div className="fortune-flow-copy">
        <span className="fortune-flow-badge">✓ 만세력 계산 완료</span>
        <h3 id="fortune-flow-title">
          {requiresLogin
            ? "로그인하고 방금 계산한 만세력을 저장하세요"
            : "이제 나의 운세 흐름을 만나보세요"}
        </h3>
        <p>
          {requiresLogin
            ? "다시 입력할 필요 없이 오늘의 운세와 사주총평을 바로 이어서 볼 수 있어요."
            : "오늘의 운세부터 재물운, 연애운까지 내 사주를 바탕으로 더 다양한 인사이트를 확인할 수 있어요."}
        </p>
        {requiresLogin && (
          <ul className="fortune-flow-benefits" aria-label="로그인 혜택">
            <li>만세력 자동 저장</li>
            <li>운세 서비스 바로 연결</li>
            <li>언제든 다시 보기</li>
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onGoHome}
        disabled={isSaving}
        className="fortune-flow-button"
      >
        <span>{isSaving ? "만세력 저장 중..." : buttonLabel}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>

      <style>{`
        .fortune-flow-card {
          position: relative;
          isolation: isolate;
          display: grid;
          grid-template-columns: 118px minmax(0, 1fr);
          align-items: center;
          column-gap: 16px;
          width: min(100%, 768px);
          margin: 42px auto 0;
          padding: 28px 24px 28px 20px;
          overflow: hidden;
          border: 2px solid rgba(66, 105, 222, 0.34);
          border-radius: 28px;
          background:
            radial-gradient(circle at 6% 12%, rgba(255, 255, 255, 0.95), transparent 31%),
            linear-gradient(120deg, #f4f8ff 0%, #eef4ff 50%, #f5f1ff 100%);
          box-shadow: 0 24px 64px rgba(54, 87, 162, 0.18);
        }

        .fortune-flow-card::before,
        .fortune-flow-card::after {
          position: absolute;
          z-index: -1;
          content: "";
          border-radius: 999px;
          filter: blur(2px);
        }

        .fortune-flow-card::before {
          width: 250px;
          height: 250px;
          left: -112px;
          top: -102px;
          background: rgba(181, 217, 255, 0.34);
        }

        .fortune-flow-card::after {
          width: 210px;
          height: 210px;
          right: -94px;
          bottom: -128px;
          background: rgba(176, 156, 242, 0.2);
        }

        .fortune-flow-symbol {
          position: relative;
          display: grid;
          width: 110px;
          height: 110px;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.88);
          border-radius: 999px;
          background:
            radial-gradient(circle at 35% 28%, rgba(255, 255, 255, 0.96), transparent 32%),
            linear-gradient(145deg, rgba(223, 242, 255, 0.94), rgba(231, 224, 255, 0.88));
          box-shadow:
            inset 0 0 28px rgba(255, 255, 255, 0.8),
            0 16px 35px rgba(78, 116, 206, 0.2);
        }

        .fortune-flow-symbol::after {
          position: absolute;
          inset: 13px;
          content: "";
          border: 1px solid rgba(117, 157, 229, 0.2);
          border-radius: 999px;
        }

        .fortune-flow-orbit {
          position: absolute;
          border: 1px solid rgba(93, 137, 222, 0.25);
          border-radius: 50%;
          transform: rotate(-24deg);
        }

        .fortune-flow-orbit-one {
          width: 96px;
          height: 54px;
        }

        .fortune-flow-orbit-two {
          width: 52px;
          height: 96px;
        }

        .fortune-flow-star {
          position: relative;
          z-index: 1;
          width: 74px;
          height: 74px;
          filter: drop-shadow(0 10px 12px rgba(80, 104, 209, 0.26));
        }

        .fortune-flow-copy {
          min-width: 0;
        }

        .fortune-flow-badge {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          margin-bottom: 9px;
          padding: 0 12px;
          border-radius: 999px;
          color: #2559c7;
          background: #e4edff;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: -0.02em;
        }

        .fortune-flow-copy h3 {
          margin: 0;
          color: #14234a;
          font-size: 23px;
          font-weight: 850;
          line-height: 1.3;
          letter-spacing: -0.045em;
          word-break: keep-all;
        }

        .fortune-flow-copy p {
          margin: 10px 0 0;
          color: #66728a;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.72;
          letter-spacing: -0.018em;
          word-break: keep-all;
        }

        .fortune-flow-benefits {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin: 14px 0 0;
          padding: 0;
          list-style: none;
        }

        .fortune-flow-benefits li {
          padding: 6px 10px;
          border: 1px solid rgba(83, 120, 211, 0.18);
          border-radius: 9px;
          color: #3f547d;
          background: rgba(255, 255, 255, 0.78);
          font-size: 12px;
          font-weight: 750;
        }

        .fortune-flow-button {
          display: inline-flex;
          grid-column: 1 / -1;
          width: 100%;
          min-height: 64px;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 20px;
          padding: 0 26px;
          border: 0;
          border-radius: 999px;
          color: white;
          background: linear-gradient(135deg, #356ee9 0%, #3f5ed9 58%, #6658d9 100%);
          box-shadow: 0 13px 27px rgba(50, 91, 211, 0.28);
          cursor: pointer;
          font-family: inherit;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.025em;
          white-space: nowrap;
          transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
        }

        .fortune-flow-button svg {
          width: 20px;
          height: 20px;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: transform 180ms ease;
        }

        .fortune-flow-button:hover {
          transform: translateY(-2px);
          filter: brightness(1.04);
          box-shadow: 0 17px 34px rgba(50, 91, 211, 0.34);
        }

        .fortune-flow-button:hover svg {
          transform: translateX(3px);
        }

        .fortune-flow-button:active {
          transform: translateY(0);
        }

        .fortune-flow-button:focus-visible {
          outline: 4px solid rgba(70, 108, 230, 0.3);
          outline-offset: 4px;
        }

        @media (max-width: 760px) {
          .fortune-flow-card {
            grid-template-columns: 98px minmax(0, 1fr);
            gap: 10px 18px;
            padding: 24px;
          }

          .fortune-flow-symbol {
            width: 94px;
            height: 94px;
          }

          .fortune-flow-star {
            width: 60px;
            height: 60px;
          }

          .fortune-flow-button {
            grid-column: 1 / -1;
            width: 100%;
            min-height: 60px;
            margin-top: 16px;
          }
        }

        @media (max-width: 560px) {
          .fortune-flow-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 30px;
            padding: 28px 22px 24px;
            text-align: center;
          }

          .fortune-flow-copy h3 {
            margin-top: 2px;
            font-size: 23px;
          }

          .fortune-flow-copy p {
            font-size: 13px;
          }

          .fortune-flow-copy p br {
            display: none;
          }

          .fortune-flow-benefits {
            justify-content: center;
          }

          .fortune-flow-button {
            width: 100%;
            max-width: none;
            margin-top: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fortune-flow-button,
          .fortune-flow-button svg {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}

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
  const flowButtonLabel = currentUser
    ? "운세 서비스 둘러보기"
    : destination === "/home"
      ? "로그인하고 운세 서비스 보기"
      : `로그인하고 ${destinationName(destination)} 보기`;

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

  

  const handleGoHome = async () => {
    if (!saju || !data) return;

    try {
      setChartSaving(true);
      setChartSaveError("");
      setChartSaveNotice("");

      const entry = createStoredSajuChart(saju, data);
      saveActiveSajuChart(entry);

      if (!currentUser) {
        savePendingFortunePath(destination);
        setChartSaveNotice(
          destination === "/home"
            ? "운세 서비스를 이용하려면 로그인해 주세요. 로그인하면 방금 계산한 만세력이 자동으로 저장됩니다."
            : `${destinationName(destination)}를 이용하려면 로그인해 주세요. 로그인 후 바로 이어서 볼 수 있습니다.`,
        );
        onRequireLogin?.();
        return;
      }

      const saveResult = await persistActiveSajuChart(entry);

      if (!saveResult.saved) {
        savePendingFortunePath(destination);
        setChartSaveNotice("로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.");
        onRequireLogin?.();
        return;
      }

      // 서비스에서 입력 화면으로 안내된 경우에는 원래 선택한 서비스로 돌아갑니다.
      // 직접 입력 화면을 연 경우에는 기존처럼 홈으로 이동합니다.
      window.location.assign(destination);
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
    <div className="mx-auto max-w-7xl px-1 pb-20 pt-14">
      <div className="mx-auto mb-6 flex w-full max-w-3xl items-center justify-between px-2">
        <h2 className="text-2xl font-black text-foreground">사주 분석 결과</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-base font-bold text-muted-foreground underline transition-colors hover:text-foreground"
        >
          다시 입력하기
        </button>
      </div>

      <div className="mx-auto w-full max-w-3xl pb-4">
        <SajuTable saju={saju} form={data} />
      </div>

      <div className="mt-3 flex w-full flex-col items-center gap-2">
        <div className="w-full max-w-3xl overflow-hidden pb-2">
          <Daeun
            daeun={saju.daeun}
            dayGan={saju.day.gan}
            birthYear={data.year}
          />
        </div>
        <div className="w-full max-w-3xl overflow-hidden pb-2">
          <SeunSinsalView saju={saju} />
        </div>
        <div className="w-full max-w-3xl overflow-hidden pb-2">
          <WolunSinsalView saju={saju} />
        </div>
      </div>

      <div className="mx-auto mt-4 w-full max-w-3xl px-1">
        <AIResult
          saju={enrichedSaju}
          interpretation={aiInterpretation}
          loading={aiLoading}
          error={aiError}
          onRequest={handleAiRequest}
          onRequireLogin={onRequireLogin}
        />
      </div>

      {chartSaveError && (
        <p className="mx-auto mt-5 max-w-3xl rounded-xl bg-red-50 px-5 py-4 text-center text-sm font-semibold text-red-600">
          {chartSaveError}
        </p>
      )}

      {chartSaveNotice && (
        <p className="mx-auto mt-5 max-w-3xl rounded-xl border border-[#cfe0ff] bg-[#f2f7ff] px-5 py-4 text-center text-sm font-semibold text-[#2456bd]">
          {chartSaveNotice}
        </p>
      )}

      <FortuneFlowCTA
        onGoHome={handleGoHome}
        isSaving={chartSaving}
        buttonLabel={flowButtonLabel}
        requiresLogin={!currentUser}
      />
    </div>
  );
}
