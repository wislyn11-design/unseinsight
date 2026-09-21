"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import FortunePageIntro from "@/app/components/fortune/page-intro/FortunePageIntro";
import {
  formatOracleHistoryDate,
  isOracleHistoryReading,
  type OracleHistoryDetailResponse,
  type OracleHistoryReading,
} from "@/app/components/fortune/oracle-history-types";

export default function OracleHistoryDetail({ readingId }: { readingId: string }) {
  const router = useRouter();
  const [reading, setReading] = useState<OracleHistoryReading | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadReading = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch(`/api/oracle/history?id=${encodeURIComponent(readingId)}`, { cache: "no-store" });
      const result = await response.json() as OracleHistoryDetailResponse;
      if (response.status === 401) {
        window.alert(typeof result.error === "string" ? result.error : "로그인 후 지난 점괘를 확인해 주세요.");
        router.replace("/home");
        return;
      }
      if (!response.ok || !isOracleHistoryReading(result.reading)) {
        throw new Error(typeof result.error === "string" ? result.error : "점괘 기록을 찾을 수 없습니다.");
      }
      setReading(result.reading);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "점괘 기록을 찾을 수 없습니다.");
    }
  }, [readingId, router]);

  useEffect(() => {
    void loadReading();
  }, [loadReading]);

  const deleteReading = async () => {
    if (!reading || !window.confirm(`“${reading.question}” 점괘 기록을 삭제할까요?\n삭제한 기록은 다시 볼 수 없습니다.`)) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/oracle/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reading.id }),
      });
      const result = await response.json() as { error?: unknown };
      if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "점괘 기록을 삭제하지 못했습니다.");
      router.replace("/fortune/oracle/history");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "점괘 기록을 삭제하지 못했습니다.");
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-74px)] bg-[radial-gradient(circle_at_50%_0%,#e8efff_0%,#f7f9ff_38%,#f5f7fc_100%)]">
      <FortunePageIntro serviceTitle="지난 고민 점괘" description="당시의 고민과 두 장의 카드 풀이를 다시 살펴보세요." showProfile={false} />
      <div className="mx-auto w-full max-w-4xl px-5 pb-14 pt-8 sm:px-8">
        {status === "loading" && <div className="rounded-[28px] border border-[#d8e3f6] bg-white px-6 py-14 text-center"><p className="animate-pulse text-sm font-extrabold text-[#315fca]">점괘 기록을 불러오고 있습니다.</p></div>}
        {status === "error" && (
          <div className="rounded-[28px] border border-[#ead7ae] bg-[#fff9ec] px-6 py-10 text-center" role="alert">
            <p className="font-bold text-[#735522]">{errorMessage}</p>
            <Link href="/fortune/oracle/history" className="mt-5 inline-flex rounded-xl bg-[#315fd3] px-5 py-3 text-sm font-extrabold text-white">목록으로 돌아가기</Link>
          </div>
        )}

        {status === "success" && reading && (
          <>
            <section className="rounded-[30px] border border-[#d8e3f6] bg-white px-6 py-7 shadow-[0_18px_48px_rgba(45,74,138,.1)] sm:px-9 sm:py-9">
              <p className="text-xs font-bold text-[#8793a6]">{formatOracleHistoryDate(reading.completedAt ?? reading.createdAt)}</p>
              <h1 className="mt-3 break-keep text-2xl font-black leading-9 tracking-[-.04em] text-[#172a4b] sm:text-3xl">{reading.question}</h1>
            </section>

            {[{ kind: "현재 마음", card: reading.currentCard, text: reading.currentReading }, { kind: "미래 흐름", card: reading.futureCard, text: reading.futureReading }].map((section) => section.card && (
              <article key={section.kind} className="mt-5 rounded-[28px] border border-[#d8e3f6] bg-white px-6 py-7 shadow-[0_16px_42px_rgba(45,74,138,.09)] sm:px-9 sm:py-9">
                <div className="relative mx-auto aspect-[2/3] w-full max-w-[320px] overflow-hidden rounded-[22px] border-2 border-[#8aa4df] bg-[#edf2fc] shadow-[0_20px_50px_rgba(45,74,138,.2)]">
                  <Image src={section.card.image} alt={`${section.card.title} 카드`} fill className="object-cover" sizes="(max-width: 480px) 80vw, 320px" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-[#315fca]">{section.kind}</span>
                </div>
                <div className="mt-7 text-center">
                  <h2 className="text-2xl font-black text-[#172a4b]">{section.card.title}</h2>
                  <p className="mt-1 text-sm font-extrabold text-[#b17826]">{section.card.keywords}</p>
                </div>
                <p className="mt-5 text-[15px] font-medium leading-8 text-[#4f5f79] sm:text-base">{section.text}</p>
              </article>
            ))}

            {reading.summaryReading && (
              <section className="mt-7 rounded-[32px] border border-[#d7e2f5] bg-[linear-gradient(145deg,#f9fbff,#eef4ff)] px-6 py-8 shadow-[0_18px_48px_rgba(45,74,138,.1)] sm:px-10">
                <p className="text-sm font-extrabold text-[#315fca]">{reading.timing?.sajuConnected ? "사주 흐름과 종합 풀이" : "두 카드 종합 풀이"}</p>
                <h2 className="mt-2 text-xl font-black text-[#172a4b]">고민의 흐름을 살펴보면</h2>
                <p className="mt-5 text-[15px] font-medium leading-8 text-[#4f5f79] sm:text-base">{reading.summaryReading}</p>
                {reading.timing && (
                  <div className="mt-5 rounded-2xl border border-[#d6e1f5] bg-white/85 px-5 py-4">
                    <p className="text-xs font-extrabold text-[#72809a]">{reading.timing.sajuConnected ? "흐름이 움직일 가능성이 커지는 시기" : "예상 시기 안내"}</p>
                    <p className="mt-1 text-lg font-black text-[#315fca]">{reading.timing.window}</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-[#65738b]">{reading.timing.basis}</p>
                  </div>
                )}
              </section>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link href="/fortune/oracle/history" className="rounded-xl bg-white px-5 py-3 text-center text-sm font-extrabold text-[#315fca] ring-1 ring-[#cfdbf0]">지난 점괘 목록</Link>
              <Link href="/fortune/oracle" className="rounded-xl bg-[#315fd3] px-5 py-3 text-center text-sm font-extrabold text-white">새 고민 점괘 보기</Link>
              <button type="button" disabled={deleting} onClick={() => void deleteReading()} className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#8b6570] ring-1 ring-[#e2cfd4] disabled:opacity-50">{deleting ? "삭제 중" : "이 기록 삭제"}</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
