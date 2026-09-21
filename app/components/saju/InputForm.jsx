"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Clock, Check, Plus, Trash2, UserRound } from "lucide-react";
import { clearActiveSajuChartIfProfile } from "@/app/lib/saju/chart-storage";

// 1. 공통 토글 버튼 컴포넌트 (디자인 유지)
function SegButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-muted/70",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// 2. 공통 라벨 필드 컴포넌트 (디자인 유지)
function Field({ label, children }) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

// 공통 인풋 스타일 클래스
const inputCls =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15";

function getAccountDisplayName(user) {
  if (!user) return "";

  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.nickname ||
    user.email?.split("@")[0] ||
    "사용자"
  );
}

// 3. 메인 사주 폼 컴포넌트 (여기에 선생님의 로직이 결합되었습니다)
export function SajuForm({ currentUser, onSubmitData }) {
  // 사용자가 입력하는 모든 데이터를 관리하는 State (선생님의 핵심 로직)
  const [profileName, setProfileName] = useState("");
  const [subjectType, setSubjectType] = useState("other");
  const [gender, setGender] = useState("male");
  const [calendar, setCalendar] = useState("solar");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");

  // v0 디자인에는 없었지만, 명리학 로직에 필수적인 '야자시' 상태 추가
  const [applyYaja, setApplyYaja] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState("");
  const [deletingProfileId, setDeletingProfileId] = useState("");
  const autoFilledNameRef = useRef("");
  const previousUserIdRef = useRef(null);
  const accountDisplayName = getAccountDisplayName(currentUser);
  const currentUserId = currentUser?.id ?? null;

  const applySavedProfile = (profile) => {
    const [birthYear = "", birthMonth = "", birthDay = ""] = String(
      profile.birthDate || "",
    ).split("-");

    setSelectedProfileId(profile.id);
    setSubjectType(profile.relationship === "self" ? "self" : "other");
    setProfileName(profile.profileName || "");
    setGender(profile.gender === "female" ? "female" : "male");
    setCalendar(profile.calendarType === "lunar" ? "lunar" : "solar");
    setYear(birthYear);
    setMonth(birthMonth);
    setDay(birthDay);
    setTime(String(profile.birthTime || "").replace(/\D/g, "").slice(0, 4));
    setApplyYaja(false);

    if (profile.relationship === "self") {
      autoFilledNameRef.current = profile.profileName || accountDisplayName;
    }
  };

  useEffect(() => {
    let cancelled = false;

    if (!currentUserId) {
      setSavedProfiles([]);
      setSelectedProfileId("");
      setProfilesError("");
      setProfilesLoading(false);
      return undefined;
    }

    setProfilesLoading(true);
    setProfilesError("");

    fetch("/api/saju-charts?view=profiles", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || "저장된 사주 목록을 불러오지 못했습니다.");
        }
        return data;
      })
      .then((data) => {
        if (cancelled) return;

        const profiles = Array.isArray(data?.profiles) ? data.profiles : [];
        setSavedProfiles(profiles);

        const selfProfile = profiles.find((profile) => profile.relationship === "self");
        if (selfProfile) {
          applySavedProfile(selfProfile);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setProfilesError(error instanceof Error ? error.message : "저장된 사주 목록을 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setProfilesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  // 로그인 계정이 바뀔 때만 저장 목록을 새로 불러옵니다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // 로그인한 사용자가 처음 들어오면 본인 이름을 자동 입력합니다.
  // 사용자가 직접 수정한 이름은 로그인 상태가 갱신되어도 덮어쓰지 않습니다.
  useEffect(() => {
    const previousUserId = previousUserIdRef.current;

    if (currentUserId) {
      setSubjectType("self");

      setProfileName((currentName) => {
        if (!currentName.trim() || currentName === autoFilledNameRef.current) {
          autoFilledNameRef.current = accountDisplayName;
          return accountDisplayName;
        }

        return currentName;
      });

    } else if (previousUserId) {
      // 로그인 상태에서 로그아웃한 경우에는 본인/타인 여부와 관계없이
      // 이전 사주 대상자의 이름을 남기지 않습니다.
      setSubjectType("other");
      setProfileName("");
      autoFilledNameRef.current = "";
    }

    previousUserIdRef.current = currentUserId;
  }, [accountDisplayName, currentUserId]);

  const selectSelf = () => {
    const savedSelf = savedProfiles.find((profile) => profile.relationship === "self");
    if (savedSelf) {
      applySavedProfile(savedSelf);
      return;
    }

    setSelectedProfileId("");
    setSubjectType("self");
    autoFilledNameRef.current = accountDisplayName;
    setProfileName(accountDisplayName);
  };

  const selectOtherPerson = () => {
    setSelectedProfileId("");
    setSubjectType("other");
    setProfileName("");
    setGender("male");
    setCalendar("solar");
    setYear("");
    setMonth("");
    setDay("");
    setTime("");
    setApplyYaja(false);
  };

  const deleteSavedProfile = async (profile) => {
    if (profile.isPrimary) return;

    const confirmed = window.confirm(
      `${profile.profileName}님의 저장된 사주와 풀이를 삭제할까요?\n삭제한 내용은 복구할 수 없습니다.`,
    );

    if (!confirmed) return;

    setDeletingProfileId(profile.id);

    try {
      const response = await fetch("/api/saju-charts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthProfileId: profile.id }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "저장된 사주를 삭제하지 못했습니다.");
      }

      clearActiveSajuChartIfProfile(profile.id);
      setSavedProfiles((profiles) =>
        profiles.filter((savedProfile) => savedProfile.id !== profile.id),
      );

      if (selectedProfileId === profile.id) {
        selectOtherPerson();
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "저장된 사주를 삭제하지 못했습니다.",
      );
    } finally {
      setDeletingProfileId("");
    }
  };

  // 폼 제출(사주 풀이 시작하기 버튼 클릭) 시 실행되는 함수

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = profileName.trim();

    // 필수값이 비어 있으면 API를 호출하지 않고 사용자에게 안내합니다.
    if (!trimmedName || !year || !month || !day) {
      alert("이름과 생년월일 정보를 모두 입력해 주세요.");
      return;
    }

    const yearNumber = Number(year);
    const monthNumber = Number(month);
    const dayNumber = Number(day);

    if (
      !Number.isInteger(yearNumber) ||
      !Number.isInteger(monthNumber) ||
      !Number.isInteger(dayNumber) ||
      yearNumber < 1000 ||
      yearNumber > 9999 ||
      monthNumber < 1 ||
      monthNumber > 12 ||
      dayNumber < 1 ||
      dayNumber > (calendar === "lunar" ? 30 : 31)
    ) {
      alert("올바른 생년월일을 입력해 주세요.");
      return;
    }

    // 양력은 실제 달력에 존재하는 날짜인지 한 번 더 확인합니다.
    if (calendar === "solar") {
      const birthDate = new Date(yearNumber, monthNumber - 1, dayNumber);
      const isValidDate =
        birthDate.getFullYear() === yearNumber &&
        birthDate.getMonth() === monthNumber - 1 &&
        birthDate.getDate() === dayNumber;

      if (!isValidDate) {
        alert("실제로 존재하는 생년월일을 입력해 주세요.");
        return;
      }
    }

    // 출생시간은 필수값입니다. 비어 있으면 결과 화면으로 넘어가지 않습니다.
    if (!time) {
      alert("태어난 시간을 입력해 주세요. 예: 오전 12시 10분은 0010");
      return;
    }

    if (!/^\d{4}$/.test(time)) {
      alert("태어난 시간은 24시간 기준 숫자 4자리로 입력해 주세요. 예: 0930");
      return;
    }

    const hour = Number(time.slice(0, 2));
    const minute = Number(time.slice(2, 4));

    // 24시는 다음 날 00시로 입력하도록 구체적인 변환 예시를 안내합니다.
    if (hour === 24 && minute >= 0 && minute <= 59) {
      const correctedTime = `00${time.slice(2, 4)}`;
      alert(
        `자정 이후 시간은 24시로 입력하지 않습니다.\n${time}은 ${correctedTime}으로 입력해 주세요.`,
      );
      return;
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      alert("올바른 태어난 시간을 입력해 주세요. 예: 오전 12시 10분은 0010");
      return;
    }

    const sajuData = {
      birthProfileId: selectedProfileId || undefined,
      profileName: trimmedName,
      isSelf: subjectType === "self",
      year,
      month,
      day,
      // 💡 핵심 수정 1: "lunar"를 백엔드가 아는 "음력"으로 번역해서 보냅니다.
      calType: calendar === "lunar" ? "음력" : "양력",
      isLeap: false,
      // 💡 핵심 수정 2: "female"을 백엔드가 아는 "여"로 번역해서 보냅니다.
      gender: gender === "female" ? "여" : "남",
      yajasi: applyYaja,
      hourInput: time,
    };

    if (onSubmitData) {
      onSubmitData(sajuData);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 max-w-lg rounded-3xl border border-border bg-card p-6 text-left shadow-xl shadow-primary/5 sm:p-7"
    >
      {currentUser && (
        <div className="mb-6 rounded-2xl border border-primary/15 bg-primary/[0.035] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">저장된 사주</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                사람을 선택하면 저장된 출생정보가 자동으로 입력됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={selectOtherPerson}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-primary/20 bg-background px-2.5 py-2 text-xs font-bold text-primary transition hover:bg-primary/5"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              새 사람
            </button>
          </div>

          {profilesLoading ? (
            <p className="rounded-xl bg-background px-3 py-3 text-center text-xs text-muted-foreground">
              저장된 사주를 불러오고 있습니다.
            </p>
          ) : profilesError ? (
            <p className="rounded-xl bg-red-50 px-3 py-3 text-xs text-red-600">
              {profilesError}
            </p>
          ) : savedProfiles.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {savedProfiles.map((profile) => {
                const active = selectedProfileId === profile.id;
                const canDelete = !profile.isPrimary;
                const deleting = deletingProfileId === profile.id;

                return (
                  <div
                    key={profile.id}
                    className={[
                      "relative min-w-[148px] overflow-hidden rounded-xl border transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background text-foreground hover:border-primary/35 hover:bg-primary/[0.025]",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => applySavedProfile(profile)}
                      className={`block w-full px-3 py-2.5 text-left ${canDelete ? "pr-10" : ""}`}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-bold">
                        <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                        {profile.profileName}
                      </span>
                      <span
                        className={[
                          "mt-1 block text-[11px]",
                          active ? "text-primary-foreground/75" : "text-muted-foreground",
                        ].join(" ")}
                      >
                        {profile.relationship === "self" ? "내 사주" : "다른 사람"}
                        {profile.birthDate ? ` · ${profile.birthDate}` : ""}
                      </span>
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        aria-label={`${profile.profileName} 저장된 사주 삭제`}
                        title="저장된 사주 삭제"
                        disabled={deleting}
                        onClick={() => deleteSavedProfile(profile)}
                        className={[
                          "absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition disabled:cursor-wait disabled:opacity-50",
                          active
                            ? "bg-white/15 text-white hover:bg-white/25"
                            : "bg-red-50 text-red-500 hover:bg-red-100",
                        ].join(" ")}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl bg-background px-3 py-3 text-center text-xs text-muted-foreground">
              아직 저장된 사주가 없습니다. 아래에서 처음 등록해 주세요.
            </p>
          )}
        </div>
      )}

      {currentUser && (
        <div className="mb-5">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            누구의 사주를 보시나요?
          </span>
          <div className="flex gap-2">
            <SegButton
              active={subjectType === "self"}
              onClick={selectSelf}
            >
              내 사주
            </SegButton>
            <SegButton
              active={subjectType === "other"}
              onClick={selectOtherPerson}
            >
              다른 사람
            </SegButton>
          </div>
        </div>
      )}

      <div>
        <Field label="사주를 볼 분의 이름">
          <input
            type="text"
            className={inputCls}
            placeholder="이름 또는 별명을 입력해 주세요"
            aria-label="사주를 볼 분의 이름"
            autoComplete="name"
            maxLength={50}
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
          />
        </Field>
        <p className="mt-2 px-1 text-xs leading-5 text-muted-foreground">
          {currentUser && subjectType === "self"
            ? "로그인 계정의 이름을 자동으로 입력했습니다. 필요하면 수정할 수 있어요."
            : "실명이 부담스러우면 별명을 입력해도 괜찮아요."}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="성별">
          <div className="flex gap-2">
            <SegButton
              active={gender === "male"}
              onClick={() => setGender("male")}
            >
              남
            </SegButton>
            <SegButton
              active={gender === "female"}
              onClick={() => setGender("female")}
            >
              여
            </SegButton>
          </div>
        </Field>

        <Field label="달력 기준">
          <div className="flex gap-2">
            <SegButton
              active={calendar === "solar"}
              onClick={() => setCalendar("solar")}
            >
              양력
            </SegButton>
            <SegButton
              active={calendar === "lunar"}
              onClick={() => setCalendar("lunar")}
            >
              음력
            </SegButton>
          </div>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="생년월일">
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              className={inputCls}
              placeholder="1978"
              aria-label="년"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <input
              type="number"
              className={inputCls}
              placeholder="05"
              aria-label="월"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <input
              type="number"
              className={inputCls}
              placeholder="21"
              aria-label="일"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </div>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="태어난 시간 (필수)">
          <div className="relative">
            <Clock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            {/* 💡 콜론 없이 숫자만 4자리 입력되도록 완벽하게 방어합니다 */}

            <input
              type="text"
              maxLength={4}
              className={`${inputCls} pl-10`}
              placeholder="예: 1930 / 오전 12시 10분은 0010"
              value={time}
              inputMode="numeric"
              onChange={(e) =>
                setTime(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
            />
          </div>
        </Field>
      </div>

      {/* 명리학 필수 로직: 야자시 적용 체크박스 (v0 디자인 톤에 맞게 세련되게 추가) */}
      <div className="mt-4 flex items-center gap-2 px-1">
        <button
          type="button"
          onClick={() => setApplyYaja(!applyYaja)}
          className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
            applyYaja
              ? "bg-primary border-primary text-primary-foreground"
              : "border-input bg-background"
          }`}
        >
          {applyYaja && <Check className="h-3.5 w-3.5" />}
        </button>
        <span
          className="text-sm font-medium text-muted-foreground cursor-pointer select-none"
          onClick={() => setApplyYaja(!applyYaja)}
        >
          야자시(夜子時) 적용하기
        </span>
      </div>

      <button
        type="submit"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.99]"
      >
        사주 풀이 시작하기
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
