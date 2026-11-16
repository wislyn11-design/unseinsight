"use client";

import { useEffect, useRef, useState } from "react";
import ChildOverviewConversation from "@/app/components/fortune/ChildOverviewConversation";
import ChildSajuForm, { type ChildBirthForm } from "@/app/components/fortune/ChildSajuForm";
import { enrichDaeunSinsal } from "@/app/lib/saju/transit-sinsal-adapter";
import { createStoredSajuChart, loadChildSajuCharts, persistActiveSajuChart, type SajuChart, type StoredSajuChart } from "@/app/lib/saju/chart-storage";

type Paragraph = { title: string; body: string };
type Story = { id: number; headline: string; keywords: string[]; paragraphs: Paragraph[]; tip: string };
type Reading = { summary: { sentence: string; keywords: string[] }; stories: Story[] };
type SavedProfile = { id: string; profileName: string; birthDate: string; isPrimary: boolean };
const topics = [
  { id: 201, title: "우리 아이 한눈에 보기", subtitle: "핵심 특징과 강점" },
  { id: 202, title: "성격과 감정 표현", subtitle: "감정을 드러내는 방식" },
  { id: 203, title: "공부와 배움", subtitle: "집중과 동기를 돕는 환경" },
  { id: 204, title: "친구와 사회성", subtitle: "관계 맺기와 갈등 대처" },
  { id: 205, title: "재능과 진로", subtitle: "경험해볼 활동과 분야" },
  { id: 206, title: "돈과 재물 성향", subtitle: "소비·저축 습관의 방향" },
] as const;

export default function ChildrenPage() {
  const [entries, setEntries] = useState<StoredSajuChart[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [listRetry, setListRetry] = useState(0);
  const [reading, setReading] = useState<Reading | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingError, setReadingError] = useState("");
  const [readingRetry, setReadingRetry] = useState(0);
  const [activeTopic, setActiveTopic] = useState<number>(201);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StoredSajuChart | null>(null);
  const [deletingId, setDeletingId] = useState("");
  const [manageError, setManageError] = useState("");
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState("");
  const operation = useRef<AbortController | null>(null);
  const readingCache = useRef(new Map<string, Reading>());
  const selected = entries.find(entry => entry.birthProfileId === selectedId);
  const story = reading?.stories.find(item => item.id === activeTopic);
  const selectedChartId = selected?.chartId;
  const selectedCalculation = selected?.calculatedAt;

  // 기존 Next.js 방문 기록은 보존하고, 이 페이지의 자녀 선택만 기록합니다.
  function selectChild(id: string) {
    if (!id || id === selectedId) return;
    window.history.pushState({ ...window.history.state, unseChildrenProfileId: id, unseChildrenPath: window.location.pathname }, "", window.location.pathname + window.location.search);
    setSelectedId(id);
  }
  function goBack() {
    if (window.history.state?.unseChildrenPath === window.location.pathname && window.history.state?.unseChildrenProfileId) window.history.back();
    else setSelectedId("");
  }
  useEffect(() => {
    const showChildList = () => {
      setSelectedId("");
      setReading(null); setReadingError(""); setReadingLoading(false);
      setActiveTopic(201); setFormOpen(false); setEditing(null); setManageError("");
    };
    const restoreSelection = () => {
      if (["#children-list", "#children-saju"].includes(window.location.hash)) {
        showChildList();
        return;
      }
      const state = window.history.state;
      setSelectedId(state?.unseChildrenPath === window.location.pathname && typeof state?.unseChildrenProfileId === "string" ? state.unseChildrenProfileId : "");
    };
    restoreSelection();
    window.addEventListener("popstate", restoreSelection);
    window.addEventListener("hashchange", restoreSelection);
    window.addEventListener("children:show-list", showChildList);
    return () => {
      window.removeEventListener("popstate", restoreSelection);
      window.removeEventListener("hashchange", restoreSelection);
      window.removeEventListener("children:show-list", showChildList);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setListLoading(true); setListError("");
    void loadChildSajuCharts(controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setEntries(data.entries);
      setSelectedId(current => data.entries.some(entry => entry.birthProfileId === current) ? current : "");
    }).catch(error => {
      if (!controller.signal.aborted) setListError(error instanceof Error ? error.message : "자녀 목록을 불러오지 못했습니다.");
    }).finally(() => { if (!controller.signal.aborted) setListLoading(false); });
    return () => controller.abort();
  }, [listRetry]);

  useEffect(() => {
    setActiveTopic(201); setReading(null); setReadingError("");
    if (!selectedChartId) { setReadingLoading(false); return; }
    const key = `${selectedChartId}:${selectedCalculation}`;
    const cached = readingCache.current.get(key);
    if (cached) { setReading(cached); setReadingLoading(false); return; }
    const controller = new AbortController();
    setReadingLoading(true);
    void (async () => {
      try {
        const response = await fetch("/api/fortune/overview", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chartId: selectedChartId, section: "children" }), signal: controller.signal });
        const data = await response.json(); controller.signal.throwIfAborted();
        if (!response.ok || data?.success !== true) throw new Error(data?.error || "자녀사주 풀이를 불러오지 못했습니다.");
        if (!data.summary?.sentence || !Array.isArray(data.stories) || data.stories.length !== topics.length ||
          topics.some(topic => !data.stories.some((item: Story) => item.id === topic.id && Array.isArray(item.paragraphs) && item.paragraphs.length === 4))) {
          throw new Error("자녀사주 풀이 응답을 확인하지 못했습니다.");
        }
        readingCache.current.set(key, data); setReading(data);
      } catch (error) {
        if (!controller.signal.aborted) setReadingError(error instanceof Error ? error.message : "자녀사주 풀이를 불러오지 못했습니다.");
      } finally { if (!controller.signal.aborted) setReadingLoading(false); }
    })();
    return () => controller.abort();
  }, [selectedChartId, selectedCalculation, readingRetry]);

  useEffect(() => () => operation.current?.abort(), []);

  useEffect(() => {
    if (!formOpen || editing) return;
    const controller = new AbortController();
    setProfilesLoading(true); setProfilesError(""); setProfiles([]);
    void (async () => {
      try {
        const response = await fetch("/api/saju-charts?view=profiles", { cache: "no-store", signal: controller.signal });
        const data = await response.json(); controller.signal.throwIfAborted();
        if (!response.ok || data?.success !== true || !Array.isArray(data.profiles)) throw new Error(data?.error || "저장된 가족 사주를 확인하지 못했습니다.");
        setProfiles(data.profiles.filter((profile: SavedProfile) => !profile.isPrimary));
      } catch (error) { if (!controller.signal.aborted) setProfilesError(error instanceof Error ? error.message : "저장된 사주를 불러오지 못했습니다."); }
      finally { if (!controller.signal.aborted) setProfilesLoading(false); }
    })();
    return () => controller.abort();
  }, [formOpen, editing]);

  function closeForm() { operation.current?.abort(); setFormOpen(false); setEditing(null); }
  function openAdd() { setEditing(null); setManageError(""); setFormOpen(true); }
  function openEdit(entry: StoredSajuChart) { setEditing(entry); setManageError(""); setFormOpen(true); }
  async function deleteChild(entry: StoredSajuChart) {
    const id = entry.birthProfileId;
    if (!id || deletingId) return;
    if (!window.confirm(`${entry.birthProfile.profileName}님의 사주를 삭제할까요?\n가족 사주 목록에서도 삭제되며, 연결된 만세력과 저장된 풀이도 함께 삭제됩니다. 궁합에서 이 사주를 다시 선택할 수 없습니다. 삭제 후 복구할 수 없습니다.`)) return;
    const controller = new AbortController(); operation.current?.abort(); operation.current = controller;
    setDeletingId(id); setManageError("");
    try {
      const response = await fetch("/api/saju-charts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ birthProfileId: id }), signal: controller.signal });
      const data = await response.json(); controller.signal.throwIfAborted();
      if (!response.ok || data?.success !== true) throw new Error(data?.error || "자녀 사주를 삭제하지 못했습니다.");
      readingCache.current.clear();
      setEntries(current => current.filter(item => item.birthProfileId !== id));
      setSelectedId(current => current === id ? "" : current);
    } catch (error) {
      if (!controller.signal.aborted) setManageError(error instanceof Error ? error.message : "자녀 사주를 삭제하지 못했습니다.");
    } finally { if (!controller.signal.aborted) setDeletingId(""); }
  }
  async function showSavedChild(birthProfileId: string, signal: AbortSignal) {
    const data = await loadChildSajuCharts(signal);
    signal.throwIfAborted();
    const entry = data.entries.find(item => item.birthProfileId === birthProfileId);
    if (!entry) throw new Error("저장 결과를 자녀 목록에서 확인하지 못했습니다. 목록을 다시 불러와 주세요.");
    setEntries(data.entries); selectChild(birthProfileId); setListError("");
    setFormOpen(false); setEditing(null);
  }
  async function saveChild(form: ChildBirthForm) {
    operation.current?.abort();
    const controller = new AbortController(); operation.current = controller;
    // 기존 입력 폼과 같은 계약으로 동일 계산 API를 호출합니다. 시간·간지를 재계산하지 않습니다.
    const response = await fetch("/api/saju", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form), signal: controller.signal });
    const data = await response.json(); controller.signal.throwIfAborted();
    if (!response.ok || data?.success !== true) throw new Error(data?.error || "만세력을 계산하지 못했습니다.");
    const chart = enrichDaeunSinsal(data.saju, form.gender) as SajuChart;
    const entry = createStoredSajuChart(chart, form);
    if (editing?.birthProfileId) entry.birthProfileId = editing.birthProfileId;
    const saved = await persistActiveSajuChart(entry, { makeActive: false, signal: controller.signal });
    if (!saved.saved) throw new Error("로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.");
    if (!saved.birthProfileId) throw new Error("저장된 자녀의 사주 연결 ID를 확인하지 못했습니다. 목록을 다시 불러와 주세요.");
    readingCache.current.clear();
    await showSavedChild(saved.birthProfileId, controller.signal);
  }
  async function useExisting(id: string) {
    operation.current?.abort();
    const controller = new AbortController(); operation.current = controller;
    const response = await fetch("/api/saju-charts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ birthProfileId: id, profileKind: "child" }), signal: controller.signal });
    const data = await response.json(); controller.signal.throwIfAborted();
    if (!response.ok || data?.success !== true) throw new Error(data?.error || "자녀로 등록하지 못했습니다.");
    await showSavedChild(id, controller.signal);
  }

  return <section className="min-h-screen w-full bg-white text-[#173568]" style={{ fontFamily: '"Pretendard Variable", Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", Arial, sans-serif', letterSpacing: "-.02em", lineHeight: 1.6 }}>
    <div id="children-saju" className="mx-auto w-full max-w-[1640px] scroll-mt-24 px-4 pb-14 pt-7 min-[801px]:px-8 min-[1101px]:px-10 sm:pt-[38px]">
      <h1 className="text-[30px] font-extrabold leading-[1.16] tracking-[-.055em] sm:text-[44px]">우리 아이 사주</h1>
      <p className="mt-4 text-[17px] leading-[1.65] text-[#7182a0] sm:text-[20px]">아이를 선택하고, 성향과 양육 가이드를 살펴보세요.</p>

      {manageError && <p role="alert" className="mt-5 text-[16px] leading-7 text-red-600">{manageError}</p>}
      {listLoading ? <p role="status" className="py-10 text-[18px] text-[#63738d]">저장된 자녀 사주를 확인하고 있습니다.</p>
        : listError ? <div role="alert" className="py-8"><p className="text-[18px] leading-8 text-red-600">{listError}</p><button type="button" onClick={() => setListRetry(v => v + 1)} className="mt-4 min-h-11 rounded-lg bg-[#2862e3] px-5 text-white">목록 다시 불러오기</button></div>
          : <>
            {!selected ? <section className="mt-10 sm:mt-14" aria-label="등록된 자녀">
              <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="flex min-h-12 items-center gap-3 text-[24px] font-bold text-[#173568] sm:text-[28px]">등록된 자녀<span className="rounded-full bg-[#f0f5ff] px-3 py-0.5 text-[20px] text-[#2462c6]" aria-label={`등록된 자녀 ${entries.length}명`}>{entries.length}</span></h2>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <button type="button" onClick={openAdd} className="min-h-12 rounded-xl bg-[#ff825b] px-6 py-3 text-[18px] font-semibold text-white transition hover:bg-[#e96e48] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2862e3]">＋ 자녀 추가</button>
                  <button type="button" onClick={openAdd} className="min-h-11 text-left text-[16px] font-semibold text-[#2462c6] underline-offset-4 hover:underline">저장된 가족 사주에서 불러오기 →</button>
                </div>
              </div>
              {!entries.length && <p className="rounded-[14px] border border-[#dfe5ee] px-6 py-10 text-[17px] leading-8 text-[#63738d]">아직 등록된 자녀가 없습니다. 아이의 사주를 먼저 등록해 주세요.</p>}
              {entries.length > 0 && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {entries.map(entry => <article key={entry.birthProfileId} aria-label={`${entry.birthProfile.profileName}님의 자녀 사주`} className="min-w-0 rounded-[14px] border border-[#dfe5ee] bg-white">
                  <button type="button" disabled={Boolean(deletingId)} onClick={() => selectChild(entry.birthProfileId || "")} className="flex min-h-[124px] w-full items-center gap-4 rounded-t-[14px] p-5 text-left transition hover:bg-[#fafcff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2862e3] disabled:opacity-60">
                    <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#cbdaf3] bg-[#f5f8ff] text-[30px] font-bold text-[#103c82] sm:text-[36px]">{entry.birthProfile.profileName.slice(0, 1)}</span>
                    <span className="min-w-0"><strong className="block break-words text-[24px] font-bold leading-[1.5] text-[#173568] sm:text-[28px]">{entry.birthProfile.profileName}</strong><span className="mt-1 block text-[16px] leading-[1.65] text-[#66748b] sm:text-[18px]">{entry.birthProfile.birthDate} · {["lunar", "음력"].includes(entry.birthProfile.calendarType) ? "음력" : "양력"}{entry.birthProfile.isLeapMonth ? " 윤달" : ""}</span><span className="mt-2 block text-[16px] font-semibold text-[#2462c6]">사주 보기 →</span></span>
                  </button>
                  <div className="flex justify-end gap-1 border-t border-[#edf1f7] px-3 py-1">
                    <button type="button" disabled={Boolean(deletingId)} onClick={() => openEdit(entry)} aria-label={`${entry.birthProfile.profileName} 사주 편집`} className="min-h-11 rounded-lg px-3 text-[15px] font-semibold text-[#526582] hover:bg-[#f5f8ff] disabled:opacity-50">편집</button>
                    <button type="button" disabled={Boolean(deletingId)} onClick={() => void deleteChild(entry)} aria-label={`${entry.birthProfile.profileName} 사주 삭제`} className="min-h-11 rounded-lg px-3 text-[15px] font-semibold text-[#b74b42] hover:bg-[#fff5f3] disabled:opacity-50">{deletingId === entry.birthProfileId ? "삭제 중…" : "삭제"}</button>
                  </div>
                </article>)}
              </div>}
              {entries.length > 0 && <p className="mt-6 flex items-start gap-3 text-[16px] leading-7 text-[#7182a0]"><span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#2862e3] text-[14px] font-semibold text-[#2862e3]">i</span>한 번 등록한 자녀는 다시 입력하지 않아도 됩니다.</p>}
            </section> : <>
              <div className="mt-7 flex flex-wrap items-center gap-3 border-b border-[#e4eaf4] pb-5">
                <button type="button" onClick={goBack} className="min-h-11 rounded-lg border border-[#ccd7e9] px-4 text-[15px] font-semibold">← 뒤로가기</button>
                <label className="sr-only" htmlFor="selected-child">자녀 선택</label>
                <select id="selected-child" value={selectedId} onChange={event => selectChild(event.target.value)} className="min-h-11 max-w-full rounded-lg border border-[#ccd7e9] bg-white px-4 text-[17px] font-semibold">
                  {entries.map(entry => <option key={entry.birthProfileId} value={entry.birthProfileId}>{entry.birthProfile.profileName}</option>)}
                </select>
                <p className="text-[15px] text-[#63738d]">{selected.birthProfile.birthDate} · {["lunar", "음력"].includes(selected.birthProfile.calendarType) ? "음력" : "양력"}{selected.birthProfile.isLeapMonth ? " 윤달" : ""} · {selected.birthProfile.birthTime ? selected.birthProfile.birthTime.slice(0, 5) : "출생시간 모름"}</p>
                <button type="button" onClick={openAdd} className="ml-auto min-h-11 rounded-xl bg-[#ff825b] px-5 text-[16px] font-semibold text-white hover:bg-[#e96e48]">＋ 자녀 추가</button>
              </div>
              {readingLoading && <p role="status" className="py-12 text-[18px] leading-8 text-[#63738d]">아이의 사주를 살펴보고 있습니다. 처음 풀이를 만들 때는 시간이 걸릴 수 있습니다.</p>}
              {readingError && <div role="alert" className="py-8"><p className="text-[18px] leading-8 text-red-600">{readingError}</p><button type="button" onClick={() => setReadingRetry(v => v + 1)} className="mt-4 min-h-11 rounded-lg bg-[#2862e3] px-5 text-white">풀이 다시 불러오기</button></div>}
              {reading && !readingLoading && !readingError && <>
                <header className="my-7 rounded-[14px] border border-[#dfe5ee] bg-white px-6 py-7 sm:px-10 sm:py-[34px]"><p className="text-[15px] font-semibold text-[#2862e3]">우리 아이 한눈에 보기</p><h2 className="mt-3 text-[25px] font-bold leading-[1.5] tracking-[-.02em] text-[#173568] sm:text-[32px]">{reading.summary.sentence}</h2><ul aria-label="아이의 핵심 특징" className="mt-4 flex flex-wrap gap-2">{reading.summary.keywords.map((keyword, index) => <li key={index} className="rounded-full border border-[#dce7fc] bg-[#f5f8ff] px-3 py-1 text-[14px] text-[#3b6cc9]">{keyword}</li>)}</ul></header>
                <h2 className="mb-5 mt-10 border-l-[3px] border-[#6191ff] pl-4 text-[24px] font-bold">궁금한 항목을 선택해보세요</h2>
                <div role="tablist" aria-label="자녀사주 풀이 항목" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {topics.map((topic, index) => <button type="button" role="tab" key={topic.id} id={`child-topic-${topic.id}`} aria-selected={activeTopic === topic.id} aria-controls="child-story" tabIndex={activeTopic === topic.id ? 0 : -1}
                    onClick={() => setActiveTopic(topic.id)} onKeyDown={event => {
                      const next = event.key === "ArrowRight" || event.key === "ArrowDown" ? (index + 1) % topics.length : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (index + topics.length - 1) % topics.length : event.key === "Home" ? 0 : event.key === "End" ? topics.length - 1 : null;
                      if (next === null) return; event.preventDefault(); setActiveTopic(topics[next].id); document.getElementById(`child-topic-${topics[next].id}`)?.focus();
                    }} className={`min-h-20 rounded-lg border-2 px-5 py-4 text-left ${activeTopic === topic.id ? "border-[#e87945] bg-[#fff4eb]" : "border-[#efb58f] bg-white hover:border-[#e87945]"}`}><strong className="block text-[20px] font-bold">{topic.title}</strong><span className="mt-2 block text-[16px] leading-[1.65] text-[#7182a0]">{topic.subtitle}</span></button>)}
                </div>
                {story && <article key={`${selected.chartId}:${story.id}`} id="child-story" role="tabpanel" aria-labelledby={`child-topic-${activeTopic}`} className="mt-7 border-t border-[#e4eaf4]">
                  <h2 className="mt-6 text-[23px] font-bold leading-9">{story.headline}</h2>
                  {story.id === 201 && selected.chartId ? <ChildOverviewConversation key={`${selected.chartId}:${selected.calculatedAt}`} chartId={selected.chartId} calculatedAt={selected.calculatedAt} story={story} /> : <>
                  {story.paragraphs.slice(0, 3).map((paragraph, index) => <section key={index} className="border-b border-[#edf1f7] py-5"><h3 className="border-l-[3px] border-[#6191ff] pl-4 text-[20px] font-bold">{paragraph.title}</h3><p className="mt-3 whitespace-pre-line pl-4 text-[20px] leading-[1.9] text-[#526582]">{paragraph.body}</p></section>)}
                  <p className="mt-5 text-[16px] leading-8 text-[#526582]"><span className="mr-3 font-semibold text-[#2862e3]">기억할 한 가지</span>{story.tip}</p>
                  <details className="mt-6 border-y border-[#e4eaf4] py-4"><summary className="cursor-pointer text-[18px] font-semibold">이렇게 풀이했어요<span className="ml-4 text-[14px] font-normal text-[#63738d]">아이의 만세력에서 읽은 근거</span></summary><p className="mt-4 whitespace-pre-line text-[18px] leading-[1.9] text-[#526582]">{story.paragraphs[3].body}</p></details>
                  </>}
                </article>}
                <p className="mt-6 text-[13px] leading-6 text-[#7d8ba1]">사주 관점의 해석입니다. 아이의 실제 모습과 경험을 함께 살펴보세요.</p>
              </>}
            </>}
          </>}
      {formOpen && <ChildSajuForm key={editing?.birthProfileId || "new"} initialValues={editing ? {
        profileName: editing.birthProfile.profileName, year: editing.birthProfile.birthDate.slice(0, 4), month: editing.birthProfile.birthDate.slice(5, 7), day: editing.birthProfile.birthDate.slice(8, 10),
        gender: editing.birthProfile.gender === "female" ? "여" : "남", calType: ["lunar", "음력"].includes(editing.birthProfile.calendarType) ? "음력" : "양력",
        isLeap: editing.birthProfile.isLeapMonth, yajasi: Boolean(editing.birthProfile.usesEarlyRatHour), hourInput: editing.birthProfile.birthTime.replace(/\D/g, "").slice(0, 4),
      } : undefined} onClose={closeForm} onSave={saveChild} onUseExisting={useExisting} profiles={profiles} profilesLoading={profilesLoading} profilesError={profilesError} />}
    </div>
  </section>;
}
