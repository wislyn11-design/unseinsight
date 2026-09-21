"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import FortunePageIntro from "@/app/components/fortune/page-intro/FortunePageIntro";
import {
  formatOracleHistoryDate,
  isOracleHistoryReading,
  type OracleHistoryListResponse,
  type OracleHistoryReading,
} from "@/app/components/fortune/oracle-history-types";

export default function OracleHistoryList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const [readings, setReadings] = useState<OracleHistoryReading[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const loadHistory = useCallback(async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const response = await fetch(`/api/oracle/history?page=${page}`, { cache: "no-store" });
      const result = await response.json() as OracleHistoryListResponse;
      if (response.status === 401) {
        window.alert(typeof result.error === "string" ? result.error : "로그인 후 지난 점괘를 확인해 주세요.");
        router.replace("/home");
        return;
      }
      if (!response.ok) {
        throw new Error(typeof result.error === "string" ? result.error : "지난 점괘를 불러오지 못했습니다.");
      }

      const nextReadings = Array.isArray(result.readings)
        ? result.readings.filter(isOracleHistoryReading)
        : [];
      setReadings(nextReadings);
      setTotal(typeof result.total === "number" ? result.total : nextReadings.length);
      setTotalPages(typeof result.totalPages === "number" ? Math.max(1, result.totalPages) : 1);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "지난 점괘를 불러오지 못했습니다.");
    }
  }, [page, router]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const deleteReading = async (reading: OracleHistoryReading) => {
    if (!window.confirm(`“${reading.question}” 점괘 기록을 삭제할까요?\n삭제한 기록은 다시 볼 수 없습니다.`)) return;
    setDeletingId(reading.id);
    try {
      const response = await fetch("/api/oracle/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reading.id }),
      });
      const result = await response.json() as { error?: unknown };
      if (!response.ok) {
        throw new Error(typeof result.error === "string" ? result.error : "점괘 기록을 삭제하지 못했습니다.");
      }

      if (readings.length === 1 && page > 1) {
        router.replace(`/fortune/oracle/history?page=${page - 1}`);
      } else {
        await loadHistory();
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "점괘 기록을 삭제하지 못했습니다.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main className="min-h-[calc(100vh-74px)] bg-[radial-gradient(circle_at_50%_0%,#e8efff_0%,#f7f9ff_38%,#f5f7fc_100%)]">
      <FortunePageIntro
        serviceTitle="지난 고민 점괘"
        description="완료한 고민 점괘와 카드의 흐름을 다시 살펴보세요."
        showProfile={false}
        sentence=""
      />

      <div className="mx-auto w-full max-w-5xl px-5 pb-14 pt-8 sm:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-[-.04em] text-[#172a4b] sm:text-3xl">나의 고민 점괘 기록</h1>
            <p className="mt-2 text-sm font-semibold text-[#7a879b]">완료된 점괘 {total}개</p>
          </div>
          <Link href="/fortune/oracle" className="rounded-xl bg-[#315fd3] px-5 py-3 text-center text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(49,95,211,.2)] transition hover:bg-[#2855c3]">
            새 고민 점괘 보기
          </Link>
        </div>

        {status === "loading" && (
          <div className="rounded-[28px] border border-[#d8e3f6] bg-white px-6 py-14 text-center shadow-[0_18px_48px_rgba(45,74,138,.09)]" aria-live="polite">
            <p className="animate-pulse text-sm font-extrabold text-[#315fca]">지난 점괘를 불러오고 있습니다.</p>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-[28px] border border-[#ead7ae] bg-[#fff9ec] px-6 py-10 text-center" role="alert">
            <p className="font-bold text-[#735522]">{errorMessage}</p>
            <button type="button" onClick={() => void loadHistory()} className="mt-5 rounded-xl bg-[#315fd3] px-5 py-3 text-sm font-extrabold text-white">다시 불러오기</button>
          </div>
        )}

        {status === "success" && readings.length === 0 && (
          <div className="rounded-[28px] border border-[#d8e3f6] bg-white px-6 py-14 text-center shadow-[0_18px_48px_rgba(45,74,138,.09)]">
            <p className="text-xl font-black text-[#172a4b]">아직 완료한 고민 점괘가 없습니다</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#7a879b]">두 장의 카드를 모두 뽑고 종합 풀이를 완료하면 이곳에 기록됩니다.</p>
            <Link href="/fortune/oracle" className="mt-6 inline-flex rounded-xl bg-[#315fd3] px-5 py-3 text-sm font-extrabold text-white">첫 고민 점괘 보기</Link>
          </div>
        )}

        {status === "success" && readings.length > 0 && (
          <div className="space-y-4">
            {readings.map((reading) => (
              <article key={reading.id} className="rounded-[28px] border border-[#d8e3f6] bg-white px-5 py-5 shadow-[0_16px_42px_rgba(45,74,138,.09)] sm:px-7 sm:py-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex shrink-0 gap-3">
                    {[reading.currentCard, reading.futureCard].map((card, index) => (
                      <div key={card?.id ?? index} className="relative aspect-[2/3] w-20 overflow-hidden rounded-xl border border-[#d4def1] bg-[#edf2fc] shadow-sm sm:w-24">
                        {card && <Image src={card.image} alt={`${card.title} 카드`} fill className="object-cover" sizes="96px" />}
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-white/90 px-2 py-1 text-[9px] font-black text-[#315fca]">{index === 0 ? "현재" : "미래"}</span>
                      </div>
                    ))}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#8793a6]">{formatOracleHistoryDate(reading.completedAt ?? reading.createdAt)}</p>
                    <h2 className="mt-2 break-keep text-lg font-black leading-7 text-[#172a4b] sm:text-xl">{reading.question}</h2>
                    <p className="mt-2 text-sm font-bold text-[#b17826]">
                      {reading.currentCard?.title ?? "현재 카드"} · {reading.futureCard?.title ?? "미래 카드"}
                    </p>
                    {reading.timing?.window && (
                      <p className="mt-2 text-sm font-semibold text-[#65738b]">예상 시기: {reading.timing.window}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    <Link href={`/fortune/oracle/history/${reading.id}`} className="flex-1 rounded-xl bg-[#315fd3] px-4 py-3 text-center text-sm font-extrabold text-white transition hover:bg-[#2855c3] sm:flex-none">다시 보기</Link>
                    <button type="button" disabled={deletingId === reading.id} onClick={() => void deleteReading(reading)} className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-[#8b6570] ring-1 ring-[#e2cfd4] transition hover:bg-[#fff7f8] disabled:opacity-50 sm:flex-none">
                      {deletingId === reading.id ? "삭제 중" : "삭제"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {status === "success" && totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-3" aria-label="점괘 기록 페이지">
            <Link href={`/fortune/oracle/history?page=${Math.max(1, page - 1)}`} aria-disabled={page <= 1} className={`rounded-xl px-4 py-3 text-sm font-extrabold ring-1 ring-[#cfdbf0] ${page <= 1 ? "pointer-events-none bg-[#f2f5fb] text-[#a4aec0]" : "bg-white text-[#315fca]"}`}>이전</Link>
            <span className="text-sm font-extrabold text-[#65738b]">{page} / {totalPages}</span>
            <Link href={`/fortune/oracle/history?page=${Math.min(totalPages, page + 1)}`} aria-disabled={page >= totalPages} className={`rounded-xl px-4 py-3 text-sm font-extrabold ring-1 ring-[#cfdbf0] ${page >= totalPages ? "pointer-events-none bg-[#f2f5fb] text-[#a4aec0]" : "bg-white text-[#315fca]"}`}>다음</Link>
          </nav>
        )}
      </div>
    </main>
  );
}
