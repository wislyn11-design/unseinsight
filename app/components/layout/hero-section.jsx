"use client"

import React from "react"
import { ShieldCheck } from "lucide-react"

import { SajuForm } from "../saju/InputForm"

export function HeroSection({ onSajuSubmit }) {
  // 폼에서 데이터가 완성되어 Submit 되었을 때 실행될 함수입니다.
  const handleSajuSubmit = (sajuData) => {
    console.log("프론트엔드에서 완성된 사주 데이터:", sajuData)
    
    // 💡 [핵심 수정 완료] 기존의 alert 창을 지우고, 부모(page.tsx)의 스위치를 켜줍니다!
    if (onSajuSubmit) {
      onSajuSubmit(sajuData)
    }
  }

  return (
    <section className="relative overflow-hidden">
      {/* 부드러운 블루 → 퍼플 그라데이션 배경 요소 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% -10%, color-mix(in oklch, var(--accent) 22%, transparent), transparent), linear-gradient(180deg, color-mix(in oklch, var(--primary) 10%, var(--background)), var(--background))",
        }}
      />

      <div className="mx-auto max-w-6xl px-5 pt-14 pb-10 text-center sm:pt-16">
        {/* 상단 뱃지 */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          명리학 데이터 · 정밀 분석 엔진
        </span>

        {/* 메인 타이틀 카피 */}
        <h1 className="mx-auto mt-6 max-w-3xl text-balance text-3xl font-black leading-tight tracking-tight sm:text-5xl sm:leading-[1.15]">
          당신의 타고난 기운과 <br className="hidden sm:block" />
          <span className="text-primary">2026년의 흐름</span>을 확인해 보세요.
        </h1>
        
        {/* 서브 카피 */}
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          명리학 데이터에 기반한 정밀한 운세 분석
        </p>

        {/* 💡 기능과 디자인이 결합된 우리의 완벽한 사주 폼 컴포넌트 호출 */}
        <SajuForm onSubmitData={handleSajuSubmit} />
      </div>
    </section>
  )
}