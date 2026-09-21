"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Sparkles, X } from "lucide-react"
import { createClient } from "@/app/lib/supabase/client"
import { KakaoIcon, NaverIcon, GoogleIcon } from "../common/brand-icons"

const PROVIDER_NAME = {
  google: "Google",
  kakao: "카카오",
  "custom:naver": "네이버",
}

function safeNextPath(nextPath) {
  const fallback = `${window.location.pathname}${window.location.search}` || "/home"

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback
  }

  return nextPath
}

export function LoginModal({ open, onClose, nextPath }) {
  const supabase = useMemo(() => createClient(), [])
  const [mounted, setMounted] = useState(false)
  const [workingProvider, setWorkingProvider] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) {
      setWorkingProvider(null)
      setErrorMessage("")
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !workingProvider) onClose()
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose, workingProvider])

  const closeModal = () => {
    if (workingProvider) return
    onClose()
  }

  const handleSocialLogin = async (provider) => {
    try {
      setWorkingProvider(provider)
      setErrorMessage("")

      const callbackUrl = new URL("/auth/callback", window.location.origin)
      callbackUrl.searchParams.set("next", safeNextPath(nextPath))

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
          
          ...(provider === "google"
            ? { queryParams: { prompt: "select_account" } }
            : provider === "kakao"
              ? { queryParams: { prompt: "login" } }
              : {}),
        },
      })

      if (error) throw error
    } catch (error) {
      console.error(`${provider} 로그인 오류:`, error)
      setErrorMessage(
        `${PROVIDER_NAME[provider]} 로그인 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.`,
      )
      setWorkingProvider(null)
    }
  }

  if (!mounted || !open) return null

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal()
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-[3px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="social-login-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="relative w-full max-w-[380px] rounded-[30px] bg-white px-7 pb-7 pt-8 shadow-[0_25px_70px_rgba(15,23,42,0.28)]"
      >
        <button
          type="button"
          aria-label="로그인 창 닫기"
          onClick={closeModal}
          disabled={Boolean(workingProvider)}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="text-center">
          <span className="mx-auto grid h-[52px] w-[52px] place-items-center rounded-full bg-[#f1e8ff] text-[#7253d8]">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2
            id="social-login-title"
            className="mt-4 text-[23px] font-extrabold tracking-[-0.03em] text-slate-900"
          >
            3초 간편 로그인
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            소셜 계정으로 빠르게 시작하세요.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => handleSocialLogin("kakao")}
            disabled={Boolean(workingProvider)}
            aria-busy={workingProvider === "kakao"}
            className="flex h-[48px] w-full items-center justify-center gap-2.5 rounded-full bg-[#FEE500] px-5 text-[15px] font-bold text-[#191919] shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <KakaoIcon />
            {workingProvider === "kakao" ? "카카오 연결 중..." : "카카오로 계속하기"}
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin("custom:naver")}
            disabled={Boolean(workingProvider)}
            aria-busy={workingProvider === "custom:naver"}
            className="flex h-[48px] w-full items-center justify-center gap-2.5 rounded-full bg-[#03C75A] px-5 text-[15px] font-bold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <NaverIcon />
            {workingProvider === "custom:naver" ? "네이버 연결 중..." : "네이버로 계속하기"}
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            disabled={Boolean(workingProvider)}
            aria-busy={workingProvider === "google"}
            className="flex h-[48px] w-full items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-white px-5 text-[15px] font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />
            {workingProvider === "google" ? "Google 연결 중..." : "Google로 계속하기"}
          </button>
        </div>

        {errorMessage && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
            {errorMessage}
          </p>
        )}

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
          로그인 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>,
    document.body,
  )
}
