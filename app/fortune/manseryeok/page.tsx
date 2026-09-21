"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Daeun from "@/app/components/saju/Daeun";
import SajuTable from "@/app/components/saju/SajuTable";
import SeunSinsalView from "@/app/components/saju/SeunSinsalView";
import WolunSinsalView from "@/app/components/saju/WolunSinsalView";
import {
  loadActiveSajuChart,
  type StoredSajuChart,
} from "@/app/lib/saju/chart-storage";
import { enrichDaeunSinsal } from "@/app/lib/saju/transit-sinsal-adapter";

type PageStatus = "loading" | "ready" | "error";

function normalizeGender(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "female" || normalized.startsWith("여") ? "여" : "남";
}

function normalizeCalendarType(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "lunar" || normalized.includes("음") ? "음력" : "양력";
}

function formFromStoredChart(entry: StoredSajuChart) {
  const [year = "", month = "", day = ""] =
    entry.birthProfile.birthDate.split("-");

  return {
    profileName: entry.birthProfile.profileName || "내 사주",
    relationship: entry.birthProfile.relationship,
    isSelf: entry.birthProfile.isSelf,
    gender: normalizeGender(entry.birthProfile.gender),
    calType: normalizeCalendarType(entry.birthProfile.calendarType),
    year,
    month,
    day,
    hourInput: entry.birthProfile.birthTime.replace(/\D/g, "").slice(0, 4),
    isLeap: entry.birthProfile.isLeapMonth,
    isYajasi: entry.birthProfile.usesEarlyRatHour,
    birthProfileId: entry.birthProfileId,
  };
}

function formatBirthSummary(entry: StoredSajuChart) {
  const calendar = normalizeCalendarType(entry.birthProfile.calendarType);
  const time = entry.birthProfile.birthTime || "시간 미입력";
  return `${entry.birthProfile.birthDate} (${calendar}) · ${time}`;
}

export default function ManseryeokPage() {
  const router = useRouter();
  const [status, setStatus] = useState<PageStatus>("loading");
  const [entry, setEntry] = useState<StoredSajuChart | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadChart = async () => {
      try {
        setStatus("loading");
        setErrorMessage("");

        const savedChart = await loadActiveSajuChart({ requirePersisted: true });
        if (cancelled) return;

        if (!savedChart) {
          router.replace(
            `/saju/input?next=${encodeURIComponent("/fortune/manseryeok")}`,
          );
          return;
        }

        setEntry(savedChart);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "저장된 만세력을 불러오지 못했습니다.",
        );
        setStatus("error");
      }
    };

    void loadChart();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const form = useMemo(() => (entry ? formFromStoredChart(entry) : null), [entry]);

  if (status === "loading" || !entry || !form) {
    if (status !== "error") {
      return (
        <section
          className="grid min-h-[calc(100vh-74px)] place-items-center px-6 py-16"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="text-center">
            <span className="mx-auto block h-11 w-11 animate-spin rounded-full border-4 border-[#dbe6ff] border-t-[#2e63df]" />
            <p className="mt-5 text-[17px] font-bold text-[#233250]">
              저장된 만세력을 불러오고 있습니다
            </p>
          </div>
        </section>
      );
    }
  }

  if (status === "error" || !entry || !form) {
    return (
      <section className="grid min-h-[calc(100vh-74px)] place-items-center px-6 py-16">
        <div className="max-w-md rounded-3xl border border-[#dce5f5] bg-white px-8 py-9 text-center shadow-sm">
          <h1 className="text-xl font-extrabold text-[#172444]">
            만세력을 불러오지 못했습니다
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-[#667085]">
            {errorMessage || "잠시 후 다시 확인해 주세요."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-[#2e63df] px-5 py-3 font-bold text-white"
            >
              다시 확인하기
            </button>
            <Link
              href={`/saju/input?next=${encodeURIComponent("/fortune/manseryeok")}`}
              className="rounded-xl border border-[#ccd8ee] bg-white px-5 py-3 font-bold text-[#2e63df]"
            >
              사주 입력하기
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const saju = enrichDaeunSinsal(entry.chart, entry.birthProfile.gender);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
      <nav className="text-sm font-semibold text-[#71809c]" aria-label="현재 위치">
        <Link href="/home" className="transition hover:text-[#2e63df]">
          홈
        </Link>
        <span className="mx-2" aria-hidden="true">›</span>
        <span className="text-[#233250]">만세력</span>
      </nav>

      <section className="mt-5 rounded-[28px] border border-[#dbe5f7] bg-[linear-gradient(135deg,#eef4ff_0%,#ffffff_68%)] px-6 py-7 shadow-[0_18px_50px_rgba(42,76,145,.08)] sm:px-9 sm:py-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-[#dfeaff] px-3 py-1.5 text-xs font-extrabold text-[#2459c6]">
              저장된 만세력
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-[-.045em] text-[#101f40] sm:text-4xl">
              {entry.birthProfile.profileName}님의 만세력
            </h1>
            <p className="mt-3 text-[15px] font-medium text-[#69768e] sm:text-base">
              {formatBirthSummary(entry)}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#7d8799]">
              저장된 출생정보와 계산 결과를 그대로 표시합니다. 이 화면에서는 다시 계산하거나 AI 풀이를 생성하지 않습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href={`/saju/input?next=${encodeURIComponent("/fortune/manseryeok")}`}
              className="rounded-xl border border-[#cdd9ee] bg-white px-4 py-3 text-sm font-bold text-[#3b4b68] transition hover:border-[#9eb7eb] hover:text-[#2459c6]"
            >
              다른 사주 보기
            </Link>
            <Link
              href="/fortune/saju"
              className="rounded-xl bg-[#2e63df] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(46,99,223,.22)] transition hover:bg-[#2458cc]"
            >
              사주총평 보기
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 w-full max-w-3xl pb-4" aria-label="사주 원국">
        <SajuTable saju={saju} form={form} />
      </section>

      <div className="mt-3 flex w-full flex-col items-center gap-2">
        <section className="w-full max-w-3xl overflow-hidden pb-2" aria-label="대운">
          <Daeun
            daeun={saju.daeun}
            dayGan={saju.day.gan}
            birthYear={form.year}
          />
        </section>
        <section className="w-full max-w-3xl overflow-hidden pb-2" aria-label="세운">
          <SeunSinsalView saju={saju} />
        </section>
        <section className="w-full max-w-3xl overflow-hidden pb-2" aria-label="월운">
          <WolunSinsalView saju={saju} />
        </section>
      </div>

      <div className="mx-auto mt-7 flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-[#dbe5f7] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold leading-6 text-[#61708b]">
          만세력을 바탕으로 풀어낸 12가지 사주 이야기도 확인해 보세요.
        </p>
        <Link
          href="/fortune/saju"
          className="shrink-0 rounded-xl bg-[#edf3ff] px-4 py-3 text-center text-sm font-extrabold text-[#2459c6] transition hover:bg-[#dfeaff]"
        >
          사주총평으로 이동
        </Link>
      </div>
    </div>
  );
}
