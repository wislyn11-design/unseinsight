"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

export type ChildBirthForm = {
  profileName: string;
  year: string;
  month: string;
  day: string;
  gender: "여" | "남";
  calType: "양력" | "음력";
  isLeap: boolean;
  yajasi: boolean;
  hourInput: string;
  hour: number;
  relationship: "other";
  isSelf: false;
  profileKind: "child";
};

type SavedProfile = { id: string; profileName: string; birthDate: string; isPrimary: boolean };
type Props = {
  initialValues?: Partial<ChildBirthForm>;
  onClose: () => void;
  onSave: (form: ChildBirthForm) => Promise<void>;
  onUseExisting: (id: string) => Promise<void>;
  profiles: SavedProfile[];
  profilesLoading: boolean;
  profilesError: string;
};

const fieldClass = "min-h-12 w-full rounded-lg border border-[#ccd7e9] bg-white px-3 py-2.5 text-[16px] text-[#233b60] outline-none focus:border-[#2862e3] focus:ring-2 focus:ring-[#2862e3]/15";

export default function ChildSajuForm({ initialValues, onClose, onSave, onUseExisting, profiles, profilesLoading, profilesError }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [calendar, setCalendar] = useState<string>(initialValues?.calType || "양력");
  const [existingId, setExistingId] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get("profileName") || "").trim();
    const year = String(fields.get("year") || "");
    const month = String(fields.get("month") || "");
    const day = String(fields.get("day") || "");
    const hour = String(fields.get("hour") || "");
    const minute = String(fields.get("minute") || "");
    const gender = String(fields.get("gender") || "");
    const y = Number(year), m = Number(month), d = Number(day);
    const testDate = new Date(y, m - 1, d);
    if (!name || !year || !month || !day || !["여", "남"].includes(gender) ||
      !Number.isInteger(y) || y < 1000 || y > new Date().getFullYear() ||
      !Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(d) || d < 1 || d > (calendar === "음력" ? 30 : 31) ||
      (calendar === "양력" && (testDate.getFullYear() !== y || testDate.getMonth() + 1 !== m || testDate.getDate() !== d))) {
      setError("이름·성별과 올바른 생년월일을 입력해 주세요."); return;
    }
    if (!hour || !minute || !/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute) || Number(hour) > 23 || Number(minute) > 59) {
      setError("태어난 시각을 00~23시, 00~59분으로 입력해 주세요."); return;
    }
    setBusy(true); setError("");
    try {
      await onSave({ profileName: name, year, month: month.padStart(2, "0"), day: day.padStart(2, "0"),
        gender: gender as "여" | "남", calType: calendar as "양력" | "음력", isLeap: fields.get("isLeap") === "on",
        yajasi: fields.get("yajasi") === "on", hourInput: hour.padStart(2, "0") + minute.padStart(2, "0"), hour: Number(hour),
        relationship: "other", isSelf: false, profileKind: "child" });
    } catch (reason) {
      if (!(reason instanceof Error && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "자녀 사주를 저장하지 못했습니다.");
    } finally { setBusy(false); }
  }

  async function useExisting() {
    if (!existingId || busy) return;
    setBusy(true); setError("");
    try { await onUseExisting(existingId); }
    catch (reason) {
      if (!(reason instanceof Error && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "저장된 사주를 연결하지 못했습니다.");
    } finally { setBusy(false); }
  }

  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="child-form-title"
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-[640px] overflow-y-auto rounded-2xl border border-[#dce5f3] bg-white p-6 text-[#152b50] shadow-2xl backdrop:bg-[#122347]/35 sm:p-9">
    <div className="flex items-start justify-between gap-4">
      <div><h2 id="child-form-title" className="text-[26px] font-bold sm:text-[30px]">{initialValues ? "자녀 사주 편집" : "자녀 사주 등록"}</h2>
        <p className="mt-2 text-[15px] leading-7 text-[#63738d]">{initialValues ? "출생정보를 수정하면 기존 계산 엔진으로 다시 계산해 저장합니다." : "아이의 정보를 한 번 저장하면 다시 입력하지 않아도 됩니다."}</p></div>
      <button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center text-2xl" aria-label="자녀 등록 창 닫기">×</button>
    </div>

    {!initialValues && <details className="mt-5 border-y border-[#e5ebf4] py-3">
      <summary className="cursor-pointer text-[15px] font-semibold text-[#2862e3]">이미 저장한 가족·지인 사주에서 선택하기</summary>
      <p className="mt-3 text-sm leading-6 text-[#63738d]">직접 선택한 대상만 자녀로 등록됩니다. 본인 대표 사주는 제외됩니다.</p>
      {profilesLoading ? <p role="status" className="mt-3 text-sm">저장된 사주를 확인하고 있습니다.</p>
        : profilesError ? <p role="alert" className="mt-3 text-sm text-red-600">{profilesError}</p>
          : profiles.length ? <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select aria-label="저장된 사주 선택" value={existingId} onChange={e => setExistingId(e.target.value)} disabled={busy} className={fieldClass}>
              <option value="">자녀로 등록할 대상을 선택하세요</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.profileName} · {p.birthDate}</option>)}
            </select>
            <button type="button" disabled={!existingId || busy} onClick={() => void useExisting()} className="min-h-12 shrink-0 rounded-lg border border-[#bdcfee] px-4 text-[15px] font-semibold text-[#2862e3] disabled:opacity-50">자녀로 등록</button>
          </div> : <p className="mt-3 text-sm text-[#63738d]">불러올 타인 사주가 없습니다. 아래에서 새로 등록해 주세요.</p>}
    </details>}

    <form onSubmit={event => void submit(event)} className="mt-6 space-y-5">
      <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
        <label className="block"><span className="mb-2 block text-[16px] font-semibold">이름 또는 별명</span><input name="profileName" defaultValue={initialValues?.profileName} required maxLength={50} autoFocus autoComplete="off" placeholder="아이를 구분할 이름을 입력해 주세요" className={fieldClass} /></label>
        <fieldset><legend className="mb-2 text-[16px] font-semibold">성별</legend><div className="flex gap-3">{["여", "남"].map(value => <label key={value} className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-3 rounded-lg border border-[#ccd7e9] px-4"><input type="radio" name="gender" value={value} defaultChecked={initialValues?.gender === value} required className="accent-[#2862e3]" />{value === "여" ? "여자" : "남자"}</label>)}</div></fieldset>
        <fieldset><legend className="mb-2 text-[16px] font-semibold">생년월일</legend>
          <div className="mb-3 flex gap-5">{["양력", "음력"].map(value => <label key={value} className="flex items-center gap-2"><input type="radio" name="calendar" value={value} checked={calendar === value} onChange={() => setCalendar(value)} className="accent-[#2862e3]" />{value}</label>)}</div>
          <div className="grid grid-cols-3 gap-3"><input name="year" defaultValue={initialValues?.year} aria-label="태어난 연도" type="number" required min={1000} max={new Date().getFullYear()} placeholder="연도" className={fieldClass} /><input name="month" defaultValue={initialValues?.month} aria-label="태어난 월" type="number" required min={1} max={12} placeholder="월" className={fieldClass} /><input name="day" defaultValue={initialValues?.day} aria-label="태어난 일" type="number" required min={1} max={calendar === "음력" ? 30 : 31} placeholder="일" className={fieldClass} /></div>
          {calendar === "음력" && <label className="mt-3 flex items-center gap-2 text-sm"><input name="isLeap" defaultChecked={initialValues?.isLeap} type="checkbox" className="accent-[#2862e3]" />윤달</label>}
        </fieldset>
        <fieldset><legend className="mb-2 text-[16px] font-semibold">태어난 시간</legend><div className="grid grid-cols-2 gap-3"><input name="hour" defaultValue={initialValues?.hourInput?.slice(0, 2)} aria-label="태어난 시" type="number" required min={0} max={23} placeholder="시 (00~23)" className={fieldClass} /><input name="minute" defaultValue={initialValues?.hourInput?.slice(2, 4)} aria-label="태어난 분" type="number" required min={0} max={59} placeholder="분 (00~59)" className={fieldClass} /></div>
          <label className="mt-3 flex items-center gap-2 text-sm text-[#7b88a0]"><input type="checkbox" disabled />출생시간을 몰라요 · 현재 지원 준비 중</label>
          <p className="mt-2 text-sm leading-6 text-[#63738d]">현재는 정확한 출생시간이 필요합니다. 모르는 시간을 임의로 입력하지 마세요.</p>
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" name="yajasi" defaultChecked={initialValues?.yajasi} className="accent-[#2862e3]" />야자시 적용</label>
        </fieldset>
      </fieldset>
      {error && <p role="alert" className="text-[15px] leading-7 text-red-600">{error}</p>}
      {busy && <p role="status" className="text-[15px] text-[#2862e3]">만세력을 확인하고 자녀 정보를 저장하고 있습니다.</p>}
      <p className="rounded-lg bg-[#f5f7fb] p-3 text-sm leading-6 text-[#63738d]">저장한 자녀 정보는 가족 사주 목록에서도 확인할 수 있습니다.</p>
      <div className="flex justify-end gap-3 border-t border-[#e5ebf4] pt-5"><button type="button" onClick={onClose} className="min-h-12 rounded-lg border border-[#ccd7e9] px-6 font-semibold">취소</button><button type="submit" disabled={busy} className="min-h-12 rounded-lg bg-[#2862e3] px-5 font-semibold text-white disabled:opacity-50">{initialValues ? "수정하고 사주 보기 →" : "저장하고 사주 보기 →"}</button></div>
    </form>
  </dialog>;
}
