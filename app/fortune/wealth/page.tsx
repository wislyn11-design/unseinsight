"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBirthTime } from "@/app/lib/saju/display-profile";

type Story = { id: number; eyebrow: string; headline: string; keywords: string[]; paragraphs: { title: string; body: string }[]; tip: string };
type Reading = { summary: { sentence: string }; stories: Story[] };
const titles: Record<number, string> = { 101: "나와 돈의 관계", 102: "돈을 버는 나의 방식", 103: "돈을 모으고 사용하는 습관", 104: "시기별 재물 흐름" };

export default function WealthPage() {
  const [reading, setReading] = useState<Reading | null>(null);
  const [profile, setProfile] = useState({ name: "", date: "", time: "", calendar: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsChart, setNeedsChart] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true); setError(""); setNeedsChart(false); setNeedsLogin(false);
      try {
        // 현재 로그인 계정에 저장된 명식을 사용합니다. 재계산하지 않습니다.
        const response = await fetch("/api/saju-charts", { cache: "no-store", signal: controller.signal });
        const data = await response.json().catch(() => null);
        if (response.status === 401) { setNeedsLogin(true); throw new Error("로그인 후 나의 재물사주를 확인해주세요."); }
        if (response.status === 404 || (response.ok && data?.success === true && data.entry === null)) {
          setNeedsChart(true); throw new Error("저장된 사주가 없습니다. 사주정보를 먼저 입력해주세요.");
        }
        if (!response.ok || !data?.success || !data.entry?.chartId) throw new Error("저장된 사주를 불러오지 못했습니다. 다시 시도해주세요.");
        const entry = data.entry;
        const p = entry.birthProfile || {};
        setProfile({ name: p.profileName || "사용자", date: p.birthDate || "", time: formatBirthTime(p.birthTime), calendar: ["lunar", "음력"].includes(p.calendarType) ? "음력" : "양력" });
        const resultResponse = await fetch("/api/fortune/overview", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chartId: entry.chartId, section: "wealth" }), signal: controller.signal,
        });
        const result = await resultResponse.json().catch(() => null);
        if (!resultResponse.ok || !result?.success) throw new Error(result?.error || "재물풀이를 불러오지 못했습니다.");
        if (!result.summary?.sentence || !Array.isArray(result.stories) || ![101,102,103,104].every(id => result.stories.some((s: Story) => s.id === id))) {
          throw new Error("재물풀이 응답을 확인하지 못했습니다. 다시 시도해주세요.");
        }
        if (!controller.signal.aborted) setReading(result);
      } catch (reason) {
        if (controller.signal.aborted) return;
        setReading(null);
        setError(reason instanceof Error ? reason.message : "재물사주를 불러오지 못했습니다.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load();
    return () => controller.abort();
  }, [retry]);

  return <section className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-6 text-[#152b50] sm:px-7 sm:pt-8">
    <p className="text-[13px] text-[#7b88a0]"><Link href="/home">홈</Link> › 재물운</p>
    <h1 className="mt-4 text-[28px] font-bold tracking-[-.035em] sm:text-[36px]">나와 돈의 관계를 읽다</h1>
    <p className="mt-2 text-[16px] leading-7 text-[#6b7d98] sm:text-[18px]">타고난 재물 성향과 인생의 흐름을 함께 살펴보세요.</p>
    {profile.name && <p className="mt-5 text-[14px] text-[#627592]">{profile.name}님 · {profile.date} ({profile.calendar}){profile.time ? ` · ${profile.time}` : ""}</p>}
    <nav className="mb-7 mt-7 flex flex-wrap gap-2 border-b border-[#dfe7f4]" aria-label="재물운 메뉴">
      <a href="#wealth-lifetime" aria-current="page" className="border-b-[3px] border-[#3978ed] bg-[#edf3ff] px-5 py-3 text-[17px] font-semibold text-[#163d7a]">나의 재물운</a>
      <button type="button" disabled className="px-4 py-3 text-[16px] text-[#8b97aa]">내 돈 고민 상담 <span className="ml-1 text-[12px]">준비 중</span></button>
    </nav>
    <div id="wealth-lifetime" className="scroll-mt-28">
      {loading && <div role="status" aria-live="polite" className="rounded-xl bg-[#f3f6ff] px-6 py-8 text-[18px] leading-8 text-[#536b91]">저장된 원국과 대운을 바탕으로 평생 재물사주를 풀이하고 있습니다. 잠시만 기다려주세요.</div>}
      {error && <div role="alert" className="rounded-xl border border-[#dfe7f4] px-6 py-7">
        <p className="text-[18px] leading-8">{error}</p>
        {needsChart ? <Link href="/saju/input" className="mt-4 inline-block rounded-lg bg-[#2e60e8] px-5 py-3 text-white">사주정보 입력하기</Link>
          : needsLogin ? <p className="mt-3 text-[#6b7d98]">상단 로그인 버튼을 눌러주세요.</p>
          : <button type="button" onClick={() => setRetry(v => v + 1)} className="mt-4 rounded-lg bg-[#2e60e8] px-5 py-3 text-white">다시 불러오기</button>}
      </div>}
      {!loading && !error && reading && <>
        <div className="mb-8 rounded-xl bg-[#f1f5ff] p-6 sm:p-8">
          <p className="text-[14px] font-semibold text-[#466db6]">평생 재물사주 · 한눈에 보는 나와 돈의 관계</p>
          <h2 className="mt-3 text-[24px] font-semibold leading-[1.65] tracking-[-.025em] sm:text-[30px]">{reading.summary.sentence}</h2>
        </div>
        <div className="mb-5"><h2 className="text-[23px] font-semibold sm:text-[27px]">나의 평생 재물사주</h2><p className="mt-2 text-[16px] leading-7 text-[#6b7d98]">궁금한 항목을 열어 자세히 읽어보세요.</p></div>
        {reading.stories.slice().sort((a,b) => a.id-b.id).map(story => <details key={story.id} open={story.id === 101} className="group border-b border-[#e2e9f4] py-5">
          <summary className="cursor-pointer text-[21px] font-semibold text-[#173764] sm:text-[24px]">{titles[story.id]}</summary>
          <div className="pt-5">
            <p className="text-[14px] text-[#5577b0]">{story.eyebrow}</p>
            <h3 className="mb-5 mt-2 text-[22px] font-semibold leading-[1.7] sm:text-[25px]">{story.headline}</h3>
            {story.paragraphs.map((paragraph, i) => <div key={i} className="mb-6"><h4 className="mb-2 text-[18px] font-semibold text-[#31578f] sm:text-[20px]">{paragraph.title}</h4><p className="whitespace-pre-line break-words text-[20px] leading-[1.9] text-[#495f7e] sm:text-[22px]">{paragraph.body}</p></div>)}
            <div className="mb-3 rounded-lg bg-[#f5f8ff] p-5"><p className="mb-2 text-[14px] font-semibold text-[#3d6bb9]">돈을 대할 때 기억할 한 가지</p><p className="text-[18px] leading-8 text-[#435e86]">{story.tip}</p></div>
          </div>
        </details>)}
        <p className="mt-7 text-[13px] leading-6 text-[#7d8ba1]">사주 관점의 해석입니다. 실제 수입·수익이나 투자 성과를 예측하거나 보장하지 않습니다.</p>
      </>}
    </div>
  </section>;
}
