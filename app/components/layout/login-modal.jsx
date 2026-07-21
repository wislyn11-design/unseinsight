"use client"

import { useEffect } from "react"
import { Sparkles, X } from "lucide-react"
import { KakaoIcon, NaverIcon, GoogleIcon } from "../common/brand-icons"


export function LoginModal({ open, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", onKey)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-5"
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />

      {/* modal box */}
      <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-7 shadow-2xl shadow-primary/10">
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 id="login-modal-title" className="mt-4 text-xl font-black tracking-tight">
            3초 간편 로그인
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">소셜 계정으로 빠르게 시작하세요.</p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-[#3c1e1e] shadow-sm transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: "#FEE500" }}
          >
            <KakaoIcon />
            카카오로 시작하기
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: "#03C75A" }}
          >
            <NaverIcon />
            네이버로 계속하기
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <GoogleIcon />
            구글 계정으로 로그인
          </button>
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground/70">
          로그인 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  )
}
