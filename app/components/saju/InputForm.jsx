"use client"

import React, { useState } from "react"
import { ArrowRight, Clock, Check } from "lucide-react"

import { Input } from "../ui/input"
import { Button } from "../ui/button"

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
  )
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
  )
}

// 공통 인풋 스타일 클래스
const inputCls =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15"

// 3. 메인 사주 폼 컴포넌트 (여기에 선생님의 로직이 결합되었습니다)
export function SajuForm({ onSubmitData }) {
  // 사용자가 입력하는 모든 데이터를 관리하는 State (선생님의 핵심 로직)
  const [gender, setGender] = useState("male")
  const [calendar, setCalendar] = useState("solar")
  const [year, setYear] = useState("")
  const [month, setMonth] = useState("")
  const [day, setDay] = useState("")
  const [time, setTime] = useState("")
  
  // v0 디자인에는 없었지만, 명리학 로직에 필수적인 '야자시' 상태 추가
  const [applyYaja, setApplyYaja] = useState(false)

  // 폼 제출(사주 풀이 시작하기 버튼 클릭) 시 실행되는 함수
  
  const handleSubmit = (e) => {
    e.preventDefault();

    const sajuData = {
      year: year,
      month: month,
      day: day,
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="성별">
          <div className="flex gap-2">
            <SegButton active={gender === "male"} onClick={() => setGender("male")}>
              남
            </SegButton>
            <SegButton active={gender === "female"} onClick={() => setGender("female")}>
              여
            </SegButton>
          </div>
        </Field>
        
        <Field label="달력 기준">
          <div className="flex gap-2">
            <SegButton active={calendar === "solar"} onClick={() => setCalendar("solar")}>
              양력
            </SegButton>
            <SegButton active={calendar === "lunar"} onClick={() => setCalendar("lunar")}>
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
        <Field label="태어난 시간">
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
              placeholder="예: 1930 (모를 경우 비워두세요)"
              value={time}
              /* 💡 해결: 강제로 지우는 마법을 없애고, 입력한 값을 있는 그대로 부드럽게 받아들입니다! */
              onChange={(e) => setTime(e.target.value)} 
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
            applyYaja ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
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
  )
}