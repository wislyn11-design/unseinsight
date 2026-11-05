"use client"

import Link from "next/link"
import { useCallback, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import LoginButton from "@/app/components/common/LoginButton"
import { clearActiveSajuChart, clearPendingFortunePath } from "@/app/lib/saju/chart-storage"

const navigation = [
  { label: "고민 점괘", href: "/fortune/oracle" },
  { label: "만세력", href: "/fortune/manseryeok" },
  { label: "운세 캘린더", href: "/fortune/calendar" },
  { label: "소원함", href: "/fortune/wish-box" },
]

export function SiteHeader({ onUserChange }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const previousUserRef = useRef(null)
  const authResolvedRef = useRef(false)
  const primaryCtaHref = currentUser ? "/fortune/saju" : "/saju/input"

  const handleUserChange = useCallback(
    (nextUser) => {
      if (authResolvedRef.current && previousUserRef.current && !nextUser) {
        clearActiveSajuChart()
        clearPendingFortunePath()
        try {
          sessionStorage.removeItem("unseinsight:free-reading-form:v1")
          sessionStorage.removeItem("unseinsight:free-reading-chat:v1")
        } catch { /* 저장소 접근 실패 무시 */ }
        if (pathname === "/fortune/oracle" || pathname.startsWith("/fortune/oracle/")) {
          router.replace("/home")
        }
      }

      previousUserRef.current = nextUser
      authResolvedRef.current = true
      setCurrentUser(nextUser)
      onUserChange?.(nextUser)
    },
    [onUserChange, pathname, router],
  )

  return (
    <header className="sticky top-0 z-40 border-b border-[#dfe5f0] bg-white/95 backdrop-blur-md">
      <div className="relative mx-auto flex h-[74px] max-w-[1540px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/home" className="flex shrink-0 items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f62dc]" aria-label="운세인사이트 홈">
          <img
            src="/brand/unseinsight-starlight.png"
            alt="운세인사이트"
            width={2048}
            height={682}
            loading="eager"
            decoding="async"
            className="block h-auto w-[192px] shrink-0 object-contain sm:w-[216px]"
          />
        </Link>

        <nav className="hidden items-center gap-9 xl:gap-[52px] lg:flex" aria-label="주요 서비스">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-2 text-[20px] font-semibold transition after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:transition ${
                  active
                    ? "text-[#2f62dc] after:bg-[#2f62dc]"
                    : "text-[#111b35] after:bg-transparent hover:text-[#2f62dc]"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LoginButton onUserChange={handleUserChange} />
          <Link href={primaryCtaHref} className="flex h-11 items-center rounded-xl bg-[#2e63df] px-6 font-bold text-white shadow-[0_7px_16px_rgba(46,99,223,.24)]">
            {currentUser ? "내 운세 보기" : "무료로 시작하기"}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-[#dce3ed] text-xl lg:hidden"
          aria-label={isMenuOpen ? "상단 메뉴 닫기" : "상단 메뉴 열기"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? "×" : "☰"}
        </button>

        {isMenuOpen && (
          <nav
            aria-label="모바일 메뉴"
            className="absolute left-0 right-0 top-full flex max-h-[calc(100dvh-74px)] flex-col gap-1 overflow-y-auto border-b bg-white p-5 shadow-lg lg:hidden"
          >
            <div className="mb-2 flex items-center border-b border-[#dfe5f0] px-4 pb-4">
              <LoginButton onUserChange={handleUserChange} />
            </div>
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-4 py-3 text-[20px] font-semibold ${
                    active ? "bg-[#edf3ff] text-[#2f62dc]" : "hover:bg-[#f3f6ff]"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            <Link
              href={primaryCtaHref}
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 rounded-xl bg-[#2e63df] px-4 py-3 text-center font-bold text-white"
            >
              {currentUser ? "내 운세 보기" : "무료로 시작하기"}
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}