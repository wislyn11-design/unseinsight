"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatBirthTime } from "@/app/lib/saju/display-profile";

type EvidenceReason = { key: "income" | "retention" | "risk"; title: string; conclusion: string; body: string; evidenceFactIds: string[] };
type Story = { id: number; eyebrow: string; headline: string; keywords: string[]; paragraphs: { title: string; body: string }[]; tip: string; evidenceReasons: EvidenceReason[] };
type Reading = { summary: { sentence: string }; stories: Story[] };
const wealthTabs = [
  { id: 101, label: "나와 돈의 관계" },
  { id: 102, label: "돈을 버는 방식" },
  { id: 103, label: "모으고 쓰는 습관" },
  { id: 104, label: "시기별 재물 흐름" },
];

export default function WealthPage() {
  const [reading, setReading] = useState<Reading | null>(null);
  const [profile, setProfile] = useState({ name: "", date: "", time: "", calendar: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsChart, setNeedsChart] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [retry, setRetry] = useState(0);
  const [activeStoryId, setActiveStoryId] = useState(101);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeStory = reading?.stories.find(story => story.id === activeStoryId);

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
        const reasonKeys = ["income", "retention", "risk"];
        if (result.stories.some((story: Story) => !Array.isArray(story.evidenceReasons) || story.evidenceReasons.length !== 3 || story.evidenceReasons.some((reason, i) => reason.key !== reasonKeys[i] || !reason.title?.trim() || !reason.conclusion?.trim() || !reason.body?.trim()))) {
          throw new Error("재물풀이 업데이트를 확인하지 못했습니다. 잠시 후 다시 불러와주세요.");
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

  return (
    <section className="min-h-screen w-full bg-white text-[#152b50]">
      <div id="wealth-lifetime" className="mx-auto w-full max-w-[1640px] scroll-mt-24 px-4 pb-14 pt-7 min-[801px]:px-8 min-[1101px]:px-10 sm:pt-9">
        {profile.name && <div className="mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-2 sm:mb-10">
          <p className="text-[24px] font-bold tracking-[-.035em] text-[#15376a] sm:text-[28px]">{profile.name}님</p>
          <p className="text-[14px] leading-6 text-[#6b7d98] sm:text-[15px]">{profile.date} ({profile.calendar}){profile.time ? ` · ${profile.time}` : ""}</p>
        </div>}

        <h1 className="text-[30px] font-bold leading-tight tracking-[-.04em] sm:text-[40px]">평생 재물사주</h1>
        <p className="mt-3 text-[16px] leading-7 text-[#6b7d98] sm:text-[18px]">돈을 벌고, 모으고, 사용하는 나만의 방식을 살펴보세요.</p>

        <div className="mb-8 mt-7 overflow-x-auto border-y border-[#e4eaf4] sm:mb-10 sm:mt-8">
          <div role="tablist" aria-label="평생 재물사주 항목" className="flex min-w-max sm:min-w-0">
            {wealthTabs.map((tab, index) => (
              <button
                key={tab.id}
                ref={node => { tabRefs.current[index] = node; }}
                type="button"
                role="tab"
                id={`wealth-tab-${tab.id}`}
                aria-selected={activeStoryId === tab.id}
                aria-controls="wealth-story-panel"
                tabIndex={activeStoryId === tab.id ? 0 : -1}
                onClick={() => setActiveStoryId(tab.id)}
                onKeyDown={event => {
                  let nextIndex = index;
                  if (event.key === "ArrowRight") nextIndex = (index + 1) % wealthTabs.length;
                  else if (event.key === "ArrowLeft") nextIndex = (index - 1 + wealthTabs.length) % wealthTabs.length;
                  else if (event.key === "Home") nextIndex = 0;
                  else if (event.key === "End") nextIndex = wealthTabs.length - 1;
                  else return;
                  event.preventDefault();
                  setActiveStoryId(wealthTabs[nextIndex].id);
                  tabRefs.current[nextIndex]?.focus();
                }}
                className={`relative min-h-14 min-w-[170px] flex-1 whitespace-nowrap px-4 py-4 text-[16px] font-semibold transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#2862e3] sm:min-w-0 sm:text-[18px] ${activeStoryId === tab.id ? "bg-[#f0f5ff] text-[#2360d9] after:absolute after:inset-x-4 after:bottom-0 after:h-[2px] after:bg-[#3978ed]" : "text-[#253858] hover:bg-[#f7f9fd]"}`}
              >{tab.label}</button>
            ))}
          </div>
        </div>

        <div id="wealth-story-panel" role="tabpanel" aria-labelledby={`wealth-tab-${activeStoryId}`} aria-busy={loading} tabIndex={0} className="outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3978ed]">
          {loading && <p role="status" aria-live="polite" className="py-8 text-[18px] leading-8 text-[#536b91]">재물풀이를 불러오고 있습니다. 처음 풀이를 생성할 때는 시간이 걸릴 수 있습니다.</p>}
          {!loading && error && <div role="alert" className="rounded-xl border border-[#dfe7f4] px-6 py-7">
            <p className="text-[18px] leading-8">{error}</p>
            {needsChart ? <Link href="/saju/input" className="mt-4 inline-block rounded-lg bg-[#2e60e8] px-5 py-3 text-white">사주정보 입력하기</Link>
              : needsLogin ? <p className="mt-3 text-[#6b7d98]">상단 로그인 버튼을 눌러주세요.</p>
              : <button type="button" onClick={() => setRetry(v => v + 1)} className="mt-4 rounded-lg bg-[#2e60e8] px-5 py-3 text-white">다시 불러오기</button>}
          </div>}
          {!loading && !error && activeStory && <article key={activeStory.id}>
            <header className="border-b border-[#e8edf5] pb-7">
              <p className="text-[14px] font-semibold text-[#2862e3]">{activeStory.eyebrow}</p>
              <h2 className="mt-3 text-[23px] font-bold leading-[1.65] tracking-[-.025em] sm:text-[28px]">{activeStory.headline}</h2>
              <ul aria-label="재물 성향 키워드" className="mt-4 flex flex-wrap gap-2">
                {activeStory.keywords.map((keyword, i) => <li key={i} className="rounded-full border border-[#dce7fc] bg-[#f5f8ff] px-3 py-1 text-[13px] font-semibold leading-6 text-[#3b6cc9]">{keyword}</li>)}
              </ul>
            </header>

            {activeStory.paragraphs.map((paragraph, i) => <section key={i} className="border-b border-[#edf1f7] py-6 sm:py-7">
              <h3 className="relative pl-4 text-[20px] font-bold leading-8 tracking-[-.025em] before:absolute before:left-0 before:top-[7px] before:h-[18px] before:w-[3px] before:rounded-full before:bg-[#6191ff]">{paragraph.title}</h3>
              <p className="mt-3 whitespace-pre-line break-words pl-4 text-[20px] leading-[1.9] text-[#526582]">{paragraph.body}</p>
            </section>)}

            <p className="mt-5 pl-4 text-[16px] leading-8 text-[#526582]"><span className="mr-2 font-semibold text-[#31578f]">기억할 한 가지</span>{activeStory.tip}</p>

            <details className="group mt-7 rounded-lg border border-[#dfe7f4]">
              <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center gap-x-5 gap-y-1 px-4 py-4 text-[18px] font-semibold [&::-webkit-details-marker]:hidden sm:px-5">
                <span>이렇게 풀이했어요</span>
                <span className="text-[14px] font-normal text-[#7b88a0] sm:border-l sm:border-[#dfe7f4] sm:pl-5 sm:text-[16px]">수입·관리·주의점의 만세력 근거</span>
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="ml-auto h-5 w-5 shrink-0 text-[#637a9f] transition-transform group-open:rotate-180"><path d="m5 7.5 5 5 5-5" /></svg>
              </summary>
              <div className="border-t border-[#e8edf5] px-4 pb-1 sm:px-5">
                {activeStory.evidenceReasons.map(reason => <section key={reason.key} className="py-5">
                  <h3 className="text-[18px] font-semibold text-[#31578f]">{reason.title}</h3>
                  <p className="mt-2 text-[18px] leading-8 text-[#435e86]">{reason.conclusion}</p>
                  <p className="mt-2 whitespace-pre-line break-words text-[18px] leading-[1.9] text-[#526582]">{reason.body}</p>
                </section>)}
              </div>
            </details>
            <p className="mt-7 text-[13px] leading-6 text-[#7d8ba1]">사주 관점의 해석입니다. 실제 수입·수익이나 투자 성과를 예측하거나 보장하지 않습니다.</p>
          </article>}
        </div>
      </div>
    </section>
  );
}
