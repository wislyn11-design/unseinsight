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
  const gender = normalizeGender(entry.birthProfile.gender);
  const time = entry.birthProfile.birthTime || "시간 미입력";
  return `${entry.birthProfile.birthDate} (${calendar}) · ${time} · ${gender}성`;
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
    <div className="min-h-[calc(100vh-74px)] w-full bg-white">
    <main className="mx-auto w-full max-w-[1180px] bg-white px-5 pb-24 pt-10 sm:px-8 lg:px-10 lg:pt-14">
      <section className="pb-8 sm:pb-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 lg:flex-1">
            <span className="text-[15px] font-extrabold tracking-[-.02em] text-[#2e63df] sm:text-[18px]">
              저장된 만세력
            </span>
            <h1 className="mt-3 text-[34px] font-black tracking-[-.05em] text-[#102650] sm:text-[48px]">
              {entry.birthProfile.profileName}님의 만세력
            </h1>
            <p className="mt-4 text-[17px] font-semibold text-[#53637e] sm:text-[21px]">
              {formatBirthSummary(entry)}
            </p>
            <p className="mt-6 max-w-3xl text-[16px] font-semibold leading-7 text-[#c96a2b] sm:text-[25px] sm:leading-8">
              정확한 사주는 정확한 만세력에서 시작됩니다.
            </p>
            <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#66758d] sm:text-[20px] sm:leading-8">
              운세인사이트는 한국천문연구원 천문 데이터를 기준으로 24절기 절입 시각까지 반영해 명식을 계산합니다. 출생 지역의 시차와 서머타임 시기까지 보정해, 한 시간 차이로 달라지는 사주도 놓치지 않습니다.
            </p>
          </div>

          <div className="flex flex-none flex-wrap gap-3">
            <Link
              href={`/saju/input?next=${encodeURIComponent("/fortune/manseryeok")}`}
              className="rounded-full border border-[#ccd7eb] bg-white px-5 py-3 text-[15px] font-bold text-[#40506d] transition hover:border-[#90aae0] hover:text-[#2459c6] sm:text-[16px]"
            >
              다른 사주 보기
            </Link>
            <Link
              href="/fortune/saju"
              className="rounded-full bg-[#2e63df] px-5 py-3 text-[15px] font-bold text-white shadow-[0_8px_18px_rgba(46,99,223,.18)] transition hover:bg-[#2458cc] sm:text-[16px]"
            >
              사주총평 보기
            </Link>
          </div>
        </div>

        <div className="relative mt-8 h-px w-full bg-[#b9c1cc] sm:mt-10" aria-hidden="true">
          <span className="absolute left-0 top-1/2 h-[3px] w-12 -translate-y-1/2 rounded-full bg-[#4777df]" />
        </div>
      </section>

      <section className="mx-auto mt-10 w-full max-w-[1040px] pb-5" aria-label="사주 원국">
        <SajuTable saju={saju} form={form} />
      </section>

      <div className="mx-auto mt-5 flex w-full max-w-[1040px] flex-col gap-5">
        <section className="w-full overflow-hidden" aria-label="대운">
          <Daeun
            daeun={saju.daeun}
            dayGan={saju.day.gan}
            birthYear={form.year}
          />
        </section>

       

        <section className="w-full overflow-hidden" aria-label="세운">
          <SeunSinsalView saju={saju} birthYear={Number(form.year)} />
        </section>
        <section className="w-full overflow-hidden" aria-label="월운">
          <WolunSinsalView saju={saju}  />
 
        </section>

      </div>

      <div className="mx-auto mt-12 flex w-full max-w-[1040px] flex-col gap-6 border-t border-[#b9c1cc] py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <p className="w-full text-center text-[18px] font-bold leading-8 tracking-[-.02em] text-[#102650] sm:text-[30px]">
          "만세력의 흐름을 사주 이야기로 이어서 살펴보세요"
        </p>
        <Link
          href="/fortune/saju"
          className="inline-flex shrink-0 items-center justify-center gap-3 self-start rounded-full border-2 border-[#173b7a] bg-white px-6 py-3 text-center text-[16px] font-extrabold text-[#173b7a] transition hover:bg-[#f5f8ff] sm:self-auto sm:px-7 sm:py-3.5 sm:text-[18px]"
        >
          <span>사주총평 보기</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
    </div>
  );
}
