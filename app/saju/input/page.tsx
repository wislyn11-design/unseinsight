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

export default function Page() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [sajuResult, setSajuResult] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [resumeError, setResumeError] = useState("")
  const [nextPath, setNextPath] = useState("/home")
  const loginResumeKeyRef = useRef("")

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
          await new Promise((resolve) => window.setTimeout(resolve, 1_500))
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

    // 로그인 사용자가 로그아웃하면 현재 만세력 결과도 함께 초기화합니다.
    if (!nextUser) {
      setResumeError("")
      setSajuResult(null)
    }
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader
        onLogin={() => setLoginOpen(true)}
        onUserChange={handleUserChange}
      />

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
        <ManseryeokResult
          data={sajuResult}
          currentUser={currentUser}
          nextPath={nextPath}
          onReset={() => setSajuResult(null)}
          onRequireLogin={() => setLoginOpen(true)}
        />
      ) : (
        <>
          <HeroSection
            currentUser={currentUser}
            onSajuSubmit={(data: any) => setSajuResult(data)}
          />
          <SocialLoginCta onLogin={() => setLoginOpen(true)} />
        </>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </main>
  )
}
