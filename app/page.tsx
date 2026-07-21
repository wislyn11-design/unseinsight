"use client"

import { useState } from "react"
import { SiteHeader } from "./components/layout/site-header"
// 💡 다시 원래 경로(./)로 복구했습니다.
import { HeroSection } from "./components/layout/hero-section" 
import { SocialLoginCta } from "./components/layout/social-login-cta"
import { LoginModal } from "./components/layout/login-modal"
import { SajuForm } from "./components/saju/InputForm"
import { ManseryeokResult } from "./components/saju/ManseryeokResult"

export default function Page() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [sajuResult, setSajuResult] = useState(null)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader onLogin={() => setLoginOpen(true)} />

      
      {sajuResult ? (
        <ManseryeokResult 
          data={sajuResult} 
          onReset={() => setSajuResult(null)} 
          onRequireLogin={() => setLoginOpen(true)} 
        />
      ) : (


        <>
          {/* 💡 수정 1: HeroSection이 기다리는 onSajuSubmit을 건네주었습니다. */}
          <HeroSection onSajuSubmit={(data: any) => setSajuResult(data)} />
          
          

          <SocialLoginCta onLogin={() => setLoginOpen(true)} />
        </>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </main>
  )
}