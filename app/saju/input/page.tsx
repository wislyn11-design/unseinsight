"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { SiteHeader } from "@/app/components/layout/site-header"
import { HeroSection } from "@/app/components/layout/hero-section"
import { SocialLoginCta } from "@/app/components/layout/social-login-cta"
import { LoginModal } from "@/app/components/layout/login-modal"
import { ManseryeokResult } from "@/app/components/saju/ManseryeokResult"
import {
  clearPendingFortunePath,
  persistActiveSajuChart,
  readActiveSajuChart,
  readPendingFortunePath,
} from "@/app/lib/saju/chart-storage"

const READING_FORM_KEY = "unseinsight:free-reading-form:v1"
const READING_CHAT_KEY = "unseinsight:free-reading-chat:v1"

export default function Page() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [sajuResult, setSajuResult] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [resumeError, setResumeError] = useState("")
  const [nextPath, setNextPath] = useState("/home")
  const loginResumeKeyRef = useRef("")
  const previousUserRef = useRef<User | null>(null)

  useEffect(() => {
    // OAuth 화면에서 돌아오거나 페이지가 다시 열려도 같은 탭의 입력을 복원합니다.
    try {
      const stored = sessionStorage.getItem(READING_FORM_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data && typeof data === "object" && !Array.isArray(data)) setSajuResult(data)
      }
    } catch { /* 저장소를 사용할 수 없으면 현재 화면에서 계속 이용합니다. */ }
  }, [])

  const handleSajuSubmit = (data: any) => {
    try {
      sessionStorage.removeItem(READING_CHAT_KEY)
      sessionStorage.setItem(READING_FORM_KEY, JSON.stringify(data))
    } catch { /* 저장소 접근 실패가 풀이 시작을 막지 않도록 합니다. */ }
    setSajuResult(data)
  }

  const handleReset = () => {
    try {
      sessionStorage.removeItem(READING_FORM_KEY)
      sessionStorage.removeItem(READING_CHAT_KEY)
    } catch { /* 저장소 접근 실패 무시 */ }
    clearPendingFortunePath()
    setSajuResult(null)
  }

  const handleCloseLogin = useCallback(() => {
    clearPendingFortunePath()
    setLoginOpen(false)
  }, [])

  useEffect(() => {
    const requestedPath = new URLSearchParams(window.location.search).get("next")

    if (
      requestedPath &&
      requestedPath.startsWith("/fortune/") &&
      !requestedPath.startsWith("//")
    ) {
      setNextPath(requestedPath)
    }
  }, [])

  useEffect(() => {
    if (!currentUser) return

    const pendingPath = readPendingFortunePath()
    if (!pendingPath) {
      setIsResuming(false)
      return
    }

    const activeSaju = readActiveSajuChart()
    if (!activeSaju) {
      setIsResuming(false)
      return
    }

    const resumeKey = `${currentUser.id}:${pendingPath}:${activeSaju.calculatedAt}`
    if (loginResumeKeyRef.current === resumeKey) return
    loginResumeKeyRef.current = resumeKey

    const saveAndResume = async () => {
      try {
        setIsResuming(true)
        setResumeError("")

        if (!activeSaju.birthProfileId || !activeSaju.chartId) {
          // OAuth 직후 발급된 JWT가 Data API에 전파될 짧은 시간을 확보합니다.
          await new Promise((resolve) => setTimeout(resolve, 1_500))
          const result = await persistActiveSajuChart(activeSaju)
          if (!result.saved) {
            throw new Error("로그인 상태를 확인하지 못했습니다.")
          }
        }

        clearPendingFortunePath()
        window.location.replace(pendingPath)
      } catch (error) {
        loginResumeKeyRef.current = ""
        setIsResuming(false)
        setResumeError(
          error instanceof Error
            ? error.message
            : "로그인 후 만세력을 저장하지 못했습니다.",
        )
        console.error("로그인 후 만세력 저장 오류:", error)
      }
    }

    void saveAndResume()
  }, [currentUser])

  const handleUserChange = useCallback((nextUser: User | null) => {
    setCurrentUser(nextUser)
    setAuthReady(true)

    const shouldResume = Boolean(
      nextUser && readPendingFortunePath() && readActiveSajuChart(),
    )
    setIsResuming(shouldResume)

    // 최초 비회원 확인과 실제 로그아웃을 구분합니다.
    if (previousUserRef.current && !nextUser) {
      setResumeError("")
      setSajuResult(null)
      clearPendingFortunePath()
      try {
        sessionStorage.removeItem(READING_FORM_KEY)
        sessionStorage.removeItem(READING_CHAT_KEY)
      } catch { /* 저장소 접근 실패 무시 */ }
    }
    previousUserRef.current = nextUser
  }, [])

  return (
    <main className="min-h-screen w-full min-w-0 max-w-full bg-background text-foreground">
      <SiteHeader
        onUserChange={handleUserChange}
      />




      {authReady && !isResuming && (
        <div className="mx-auto flex w-full max-w-[1400px] justify-end px-4 pt-4 sm:px-8">
          {currentUser ? (
            <a href="/home" className="inline-flex min-h-11 items-center rounded-full border border-[#dbe5f5] bg-white px-5 text-sm font-semibold text-[#245bc3] hover:bg-[#f1f5ff]">메인으로 이동 →</a>
          ) : (
            <button type="button" onClick={() => setLoginOpen(true)} className="inline-flex min-h-11 items-center rounded-full bg-[#edf3ff] px-5 text-sm font-bold text-[#245bc3] transition hover:bg-[#dfeaff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2862e3]">간편 로그인창 열기 →</button>
          )}
        </div>
      )}

      {!authReady || isResuming ? (
        <section
          className="grid min-h-[calc(100vh-74px)] place-items-center px-6 py-16"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="text-center">
            <span className="mx-auto block h-11 w-11 animate-spin rounded-full border-4 border-[#dbe6ff] border-t-[#2e63df]" />
            <p className="mt-5 text-[17px] font-bold text-[#233250]">
              로그인 정보를 확인하고 만세력을 연결하고 있습니다
            </p>
          </div>
        </section>
      ) : resumeError ? (
        <section className="grid min-h-[calc(100vh-74px)] place-items-center px-6 py-16">
          <div className="max-w-md rounded-3xl border border-red-100 bg-white px-8 py-9 text-center shadow-sm">
            <h2 className="text-xl font-extrabold text-[#172444]">
              만세력을 저장하지 못했습니다
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-[#667085]">
              {resumeError}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-[#2e63df] px-6 py-3 font-bold text-white"
            >
              다시 시도하기
            </button>
          </div>
        </section>
      ) : sajuResult ? (
        <>
        <ManseryeokResult
          data={sajuResult}
          currentUser={currentUser as any}
          nextPath={nextPath}
          onReset={handleReset}
          onRequireLogin={() => setLoginOpen(true)}
        />
        {!currentUser && <SocialLoginCta onLogin={() => setLoginOpen(true)} showButton={false} />}
        </>
      ) : (
        <>
          <HeroSection
            currentUser={currentUser}
            onSajuSubmit={handleSajuSubmit}
          />
          {!currentUser && <SocialLoginCta onLogin={() => setLoginOpen(true)} showButton={false} />}
        </>
      )}
      {/* @ts-ignore */}
      <LoginModal open={loginOpen} onClose={handleCloseLogin} />
    </main>
  )
}
