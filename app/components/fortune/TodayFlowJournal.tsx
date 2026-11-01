"use client";

import { useEffect, useRef, useState } from "react";

type Task = { text: string; done: boolean };
type Review = { tasks: Task[]; mood: number; goodText: string; difficultText: string; nextText: string };
type RecordRow = { date: string; planText: string; review: Review | null };
type Report = {
  from: string; to: string; planDays: number; reviewDays: number; taskCount: number;
  completed: number; completionRate: number | null; averageMood: number | null;
  repeated: { task: string; days: number; reviewed: number; completed: number }[];
  trend: { beforeRate: number; afterRate: number; difference: number; beforeStart: string; beforeEnd: string; afterStart: string; afterEnd: string } | null;
  records: RecordRow[];
};
const textArea = "mt-3 w-full rounded-xl border border-[#dce3ee] bg-white p-4 text-[18px] leading-8 text-[#314663] outline-none focus:border-[#3978ed] sm:text-[22px]";
const heading = "border-l-[4px] border-[#3978ed] pl-4 text-[22px] font-black text-[#17345f] sm:text-[28px]";
const box = "rounded-2xl border border-[#dce3ee] bg-white p-5 sm:p-7";
const blankReview = (): Review => ({tasks:[],mood:3,goodText:"",difficultText:"",nextText:""});
function taskLines(text: string): Task[] {
  return text.split("\n").map(t=>t.trim()).filter(Boolean).slice(0,10).map(text=>({text,done:false}));
}
async function readResponse(response: Response) {
  const data = await response.json().catch(()=>null);
  if (!response.ok || !data?.success) throw new Error(data?.error || "기록을 불러오지 못했습니다.");
  return data;
}
export default function TodayFlowJournal({chartId,date,view,planText,onSelectDate}: {
  chartId:string; date:string; view:"today-fortune" | "today-plan" | "today-review" | "today-report"; planText:string;
  onSelectDate:(date:string)=>void;
}) {
  const [review,setReview] = useState<Review>(blankReview);
  const [loaded,setLoaded] = useState(false);
  const [saving,setSaving] = useState(false);
  const [saved,setSaved] = useState(false);
  const [error,setError] = useState("");
  const [days,setDays] = useState(30);
  const [revision,setRevision] = useState(0);
  const [report,setReport] = useState<Report | null>(null);
  const [reportLoading,setReportLoading] = useState(false);
  const [reportError,setReportError] = useState("");
  const saveRequest = useRef<AbortController | null>(null);

  useEffect(()=> {
    if (!chartId || !date) return;
    const controller = new AbortController();
    setLoaded(false); setError(""); setSaved(false);
    void fetch(`/api/fortune/today-journal?chartId=${encodeURIComponent(chartId)}&date=${date}`,{cache:"no-store",signal:controller.signal})
      .then(readResponse).then(data=>{
        if(controller.signal.aborted) return;
        const r=data.review;
        setReview(r ? {tasks:r.tasks,mood:r.mood,goodText:r.good_text,difficultText:r.difficult_text,nextText:r.next_text}
          : {...blankReview(),tasks:taskLines(data.planText)});
        setSaved(Boolean(r)); setLoaded(true);
      }).catch(reason=> {if(!controller.signal.aborted) setError(reason.message);});
    return ()=>{controller.abort();saveRequest.current?.abort();};
    // Parent keys this component by chart/date. Editing a plan must not overwrite a draft review.
  },[chartId,date]);

  useEffect(()=>{
    if(view!=="today-report" || !chartId || !date) return;
    const controller=new AbortController();
    setReportLoading(true);setReportError("");setReport(null);
    void fetch(`/api/fortune/today-journal?mode=report&chartId=${encodeURIComponent(chartId)}&date=${date}&days=${days}`,{cache:"no-store",signal:controller.signal})
      .then(readResponse).then(data=>{if(!controller.signal.aborted)setReport(data);})
      .catch(reason=>{if(!controller.signal.aborted)setReportError(reason.message);})
      .finally(()=>{if(!controller.signal.aborted)setReportLoading(false);});
    return ()=>controller.abort();
  },[view,chartId,date,days,revision]);

  const changeReview = (next:Review) => {setReview(next);setSaved(false);setError("");};
  const save = async () => {
    if(!loaded || saving) return;
    const controller=new AbortController();saveRequest.current=controller;
    setSaving(true);setError("");setSaved(false);
    try {
      await fetch('/api/fortune/today-journal',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({chartId,date,...review}),signal:controller.signal}).then(readResponse);
      if(!controller.signal.aborted){setSaved(true);setRevision(n=>n+1);}
    } catch(reason) {
      if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'하루 기록을 저장하지 못했습니다.');
    } finally {if(!controller.signal.aborted)setSaving(false);}
  };

  return <>
    <section id="today-review" role="tabpanel" aria-labelledby="today-review-tab" hidden={view!=="today-review"}>
      <h2 className={heading}>운세일기</h2>
      <p className="mt-3 text-[18px] leading-8 text-[#66758d] sm:text-[21px]">{date}의 실제 하루를 남겨보세요. 기록이 쌓이면 운세 리포트에서 함께 살펴볼 수 있습니다.</p>
      {!chartId && <p className="mt-6">만세력을 먼저 선택해 주세요.</p>}
      {chartId && !loaded && !error && <p className="mt-6" role="status">하루 기록을 불러오는 중…</p>}
      {loaded && <fieldset disabled={saving} className="mt-6 space-y-6 disabled:opacity-70">
        <div className={box}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-[20px] font-extrabold text-[#17345f] sm:text-[24px]">오늘 실행한 일</h3>
            <button type="button" onClick={()=>changeReview({...review,tasks:taskLines(planText).map(t=>({...t,done:review.tasks.find(old=>old.text===t.text)?.done || false}))})}
              disabled={!planText.trim()} className="rounded-lg border border-[#bfd0ee] px-4 py-2 font-bold text-[#245fc8] disabled:opacity-40">현재 계획 불러오기</button>
          </div>
          <p className="mt-2 text-[16px] leading-7 text-[#66758d]">완료한 일을 체크하세요. 저장할 때 체크하지 않은 일은 미완료로 집계됩니다.</p>
          {!review.tasks.length && <p className="mt-4 text-[#66758d]">등록된 할 일이 없습니다. 계획 없이 하루의 느낌만 기록해도 괜찮습니다.</p>}
          <div className="mt-4 space-y-3">{review.tasks.map((t,i)=><label key={i} className="flex items-start gap-3 rounded-xl bg-[#f5f8fd] p-4 text-[19px] leading-8 text-[#314663] sm:text-[23px]">
            <input type="checkbox" checked={t.done} onChange={e=>changeReview({...review,tasks:review.tasks.map((t,n)=>n===i?{...t,done:e.target.checked}:t)})} className="mt-1.5 h-5 w-5 shrink-0 accent-[#3978ed]"/>
            <span className={t.done?"line-through opacity-60":""}>{t.text}</span>
          </label>)}</div>
        </div>
        <div className={box}>
          <h3 className="text-[20px] font-extrabold text-[#17345f] sm:text-[24px]">오늘의 만족도</h3>
          <div className="mt-4 flex flex-wrap gap-3" role="group" aria-label="오늘의 만족도, 1점부터 5점">
            {[1,2,3,4,5].map(n=><button type="button" key={n} aria-pressed={review.mood===n} onClick={()=>changeReview({...review,mood:n})}
              className={`min-h-12 min-w-14 rounded-xl border px-4 py-3 text-[20px] font-bold ${review.mood===n?'border-[#3978ed] bg-[#edf3ff] text-[#245fc8]':'border-[#dce3ee] text-[#66758d]'}`}>{n}점</button>)}
          </div>
          <p className="mt-3 text-[16px] text-[#66758d]">1점: 많이 아쉬워요 · 3점: 보통이에요 · 5점: 만족스러워요. 현재 {review.mood}점이 선택되어 있습니다.</p>
        </div>
        {([
          ['goodText','오늘 잘한 점','작은 일이라도 잘해낸 순간을 적어보세요.'],
          ['difficultText','어려웠던 점','계획을 실천하기 어려웠던 이유나 상황을 남겨보세요.'],
          ['nextText','내일로 이어갈 한 가지','내일 다시 해보고 싶은 작은 행동을 적어보세요.'],
        ] as const).map(([key,label,placeholder])=><div key={key} className={box}>
          <label htmlFor={`review-${key}`} className="text-[20px] font-extrabold text-[#17345f] sm:text-[24px]">{label}</label>
          <textarea id={`review-${key}`} rows={3} maxLength={1000} value={review[key]} placeholder={placeholder} onChange={e=>changeReview({...review,[key]:e.target.value})} className={textArea}/>
          <p className="text-right text-[14px] text-[#8794a8]">{review[key].length} / 1,000자</p>
        </div>)}
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={()=>void save()} disabled={saving} className="rounded-xl bg-[#2f66df] px-8 py-4 text-[19px] font-extrabold text-white disabled:opacity-60">{saving?'저장하는 중…':'운세일기 저장하기'}</button>
          <p role="status" className="text-[17px] text-[#177a55]">{saved?'저장되었습니다. 리포트에 반영됩니다.':''}</p>
        </div>
      </fieldset>}
      {error && <div role="alert" className="mt-4 rounded-xl bg-[#fff4f1] p-4 text-[#b94b35]">{error}{!loaded && <button type="button" onClick={()=>window.location.reload()} className="ml-3 underline">다시 불러오기</button>}</div>}
    </section>

    <section id="today-report" role="tabpanel" aria-labelledby="today-report-tab" hidden={view!=="today-report"}>
      <h2 className={heading}>운세 리포트</h2>
      <p className="mt-3 text-[18px] leading-8 text-[#66758d] sm:text-[21px]">계획과 실제 하루 기록에서 반복되는 일과 실천의 변화를 살펴봅니다.</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {[7,30].map(n=><button key={n} type="button" aria-pressed={days===n} onClick={()=>setDays(n)} className={`rounded-xl border px-5 py-3 font-bold ${days===n?'border-[#3978ed] bg-[#edf3ff] text-[#245fc8]':'border-[#dce3ee] text-[#66758d]'}`}>최근 {n}일</button>)}
        <button type="button" onClick={()=>setRevision(n=>n+1)} disabled={reportLoading} className="px-3 py-2 font-bold text-[#245fc8] disabled:opacity-40">새로고침</button>
      </div>
      {reportLoading && <p role="status" className="mt-6">기록을 모으는 중…</p>}
      {reportError && <p role="alert" className="mt-5 rounded-xl bg-[#fff4f1] p-4 text-[#b94b35]">{reportError}</p>}
      {report && <div className="mt-6 space-y-6">
        <p className="text-[16px] text-[#66758d]">{report.from} ~ {report.to} · 위 달력에서 선택한 날짜까지의 기록입니다.</p>
        {!report.records.length ? <div className={box}><h3 className="text-[22px] font-bold text-[#17345f]">아직 쌓인 기록이 없습니다</h3><p className="mt-3 text-[18px] leading-8 text-[#66758d]">‘오늘 일정 점보기’에서 계획을 저장하고 ‘운세일기’에서 실제 하루를 남겨보세요. 기록이 생기면 이곳에 표시됩니다.</p></div> : <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
            ['계획을 남긴 날',`${report.planDays}일`],['돌아본 날',`${report.reviewDays}일`],
            ['기록한 일의 완료율',report.completionRate===null?'아직 없음':`${report.completionRate}%`],
            ['평균 만족도',report.averageMood===null?'아직 없음':`${report.averageMood} / 5점`],
          ].map(([label,value])=><div key={label} className={box}><p className="text-[16px] text-[#66758d]">{label}</p><strong className="mt-3 block text-[28px] text-[#17345f]">{value}</strong></div>)}</div>
          <p className="text-[15px] leading-7 text-[#66758d]">완료율은 운세일기에 저장한 할 일 {report.taskCount}개 중 완료한 {report.completed}개를 기준으로 합니다. 돌아보지 않은 날은 미완료로 계산하지 않습니다.</p>
          <div className={box}><h3 className="text-[22px] font-extrabold text-[#17345f]">실천 흐름의 변화</h3>
            {report.trend ? <><p className="mt-4 text-[22px] font-bold text-[#245fc8]">이전 {report.trend.beforeRate}% → 최근 {report.trend.afterRate}%</p><p className="mt-3 text-[18px] leading-8 text-[#53627a]">{report.trend.difference>0?`최근 기록의 완료율이 ${report.trend.difference}%p 높아졌습니다.`:report.trend.difference<0?`최근 기록의 완료율이 ${Math.abs(report.trend.difference)}%p 낮아졌습니다. 계획의 양과 어려웠던 상황을 함께 살펴보세요.`:'두 구간의 완료율이 같습니다.'}</p><p className="mt-3 text-[15px] leading-7 text-[#66758d]">기록한 날을 시간순으로 절반씩 나누어 비교했습니다. 이전: {report.trend.beforeStart} ~ {report.trend.beforeEnd} / 최근: {report.trend.afterStart} ~ {report.trend.afterEnd}. 할 일의 난이도와 양은 다를 수 있습니다.</p></> : <p className="mt-4 text-[18px] leading-8 text-[#66758d]">할 일이 포함된 운세일기 기록이 쌓이면 이전과 최근의 완료율을 비교합니다. 운세일기 기록이 최소 4일 필요하고 두 구간 모두 할 일이 있어야 합니다.</p>}
          </div>
          <div className={box}><h3 className="text-[22px] font-extrabold text-[#17345f]">반복해서 등장한 일</h3>
            <p className="mt-2 text-[15px] leading-7 text-[#66758d]">띄어쓰기를 제외하고 같은 이름으로 2일 이상 등장한 일입니다. 비슷한 의미의 다른 표현은 합치지 않습니다.</p>
            {report.repeated.length ? <div className="mt-4 space-y-3">{report.repeated.map(p=><div key={p.task} className="rounded-xl bg-[#f5f8fd] p-4"><strong className="text-[20px] text-[#17345f]">{p.task}</strong><p className="mt-2 text-[17px] text-[#53627a]">{p.days}일 등장 · {p.reviewed?`돌아본 ${p.reviewed}일 중 완료 ${p.completed}일 · 미완료 ${p.reviewed-p.completed}일`:'아직 운세일기 기록 없음'}</p>{p.reviewed-p.completed>=2 && <p className="mt-2 text-[17px] text-[#a56014]">미완료가 반복되었습니다. 다음에는 한 번에 할 양을 줄여보세요.</p>}</div>)}</div> : <p className="mt-4 text-[18px] text-[#66758d]">아직 반복해서 등장한 일이 없습니다.</p>}
          </div>
          <div className={box}><h3 className="text-[22px] font-extrabold text-[#17345f]">날짜별 일정과 운세일기</h3>
            <p className="mt-2 text-[16px] text-[#66758d]">잘한 점과 어려웠던 상황을 비교하며 나만의 흐름을 찾아보세요.</p>
            <div className="mt-5 space-y-4">{report.records.map(r=><article key={r.date} className="rounded-xl border border-[#e1e7f0] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3"><h4 className="text-[20px] font-bold text-[#17345f]">{r.date}</h4><button type="button" onClick={()=>onSelectDate(r.date)} className="font-bold text-[#245fc8]">이날 운세일기 열기 →</button></div>
              <p className="mt-3 whitespace-pre-wrap text-[18px] leading-8 text-[#53627a]">{r.planText || '저장된 계획 없음'}</p>
              {r.review ? <div className="mt-4 space-y-2 border-t border-[#e1e7f0] pt-4 text-[17px] leading-8 text-[#53627a]">
                <p>만족도 {r.review.mood}점 · 완료 {r.review.tasks.filter(t=>t.done).length}/{r.review.tasks.length}개</p>
                {r.review.tasks.length>0 && <ul className="space-y-1">{r.review.tasks.map((t,i)=><li key={i}>{t.done?'완료':'미완료'} · {t.text}</li>)}</ul>}
                {r.review.goodText && <p className="whitespace-pre-wrap">잘한 점: {r.review.goodText}</p>}
                {r.review.difficultText && <p className="whitespace-pre-wrap">어려웠던 점: {r.review.difficultText}</p>}
                {r.review.nextText && <p className="whitespace-pre-wrap">이어갈 한 가지: {r.review.nextText}</p>}
              </div> : <p className="mt-4 text-[16px] text-[#8794a8]">아직 운세일기를 남기지 않았습니다.</p>}
            </article>)}</div>
          </div>
        </>}
      </div>}
    </section>
  </>;
}
