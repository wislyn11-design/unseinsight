"use client"

import Link from "next/link"
import { useCallback, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import MobileBottomNavigation from "./mobile-bottom-navigation"
import VipBrand from "@/app/consult/VipBrand"
import StaffLinks from "@/app/consult/StaffLinks";
import LoginButton from "@/app/components/common/LoginButton"
import { clearActiveSajuChart, clearPendingFortunePath } from "@/app/lib/saju/chart-storage"

const navigation = [
  { label: "고민 점괘", href: "/fortune/oracle" },
  { label: "만세력", href: "/fortune/manseryeok" },
  { label: "운세 캘린더", href: "/fortune/calendar" },
  { label: "소원함", href: "/fortune/wish-box" },
]

/**
 * @param {{ onUserChange?: (user: any) => void }} [props]
 */
export function SiteHeader({ onUserChange } = {}) {
  const pathname = usePathname()
  const router = useRouter()
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
    <>
    <header className="sticky top-0 z-40 border-b border-[#dfe5f0] bg-white/95 backdrop-blur-md">
      <div className="relative mx-auto flex h-[74px] max-w-[1540px] items-center justify-between gap-3 px-4 sm:px-8 lg:px-10">
        <VipBrand />

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

        <div className="mobile-header-auth flex shrink-0 items-center gap-3">
          <StaffLinks /><LoginButton onUserChange={handleUserChange} />
          <Link href={primaryCtaHref} className="hidden h-11 items-center rounded-xl bg-[#2e63df] lg:flex px-6 font-bold text-white shadow-[0_7px_16px_rgba(46,99,223,.24)]">
            {currentUser ? "내 운세 보기" : "무료로 시작하기"}
          </Link>
        </div>

      </div>
    </header>
    <MobileBottomNavigation navigation={navigation} pathname={pathname || ""} primaryCtaHref={primaryCtaHref} />
    <style jsx global>{`
      @media (max-width: 1023px) {
        body:not(:has(#fortune-content)) {
          padding-bottom: calc(94px + env(safe-area-inset-bottom, 0px));
        }
        #fortune-content {
          padding-bottom: calc(94px + env(safe-area-inset-bottom, 0px));
          scroll-padding-bottom: calc(94px + env(safe-area-inset-bottom, 0px));
        }
        .mobile-header-auth > div > span { display: none; }
        .mobile-header-auth > button,
        .mobile-header-auth > div > button {
          min-height: 44px;
          padding-left: 12px;
          padding-right: 12px;
          font-size: 16px;
          white-space: nowrap;
        }
        body { padding-bottom: calc(78px + env(safe-area-inset-bottom, 0px)); }
        body:has(#fortune-content) { padding-bottom: 0; }
        #fortune-content { padding-bottom: calc(94px + env(safe-area-inset-bottom, 0px)); }
        #fortune-content { scroll-padding-bottom: calc(94px + env(safe-area-inset-bottom, 0px)); }
      }
    `}</style>
    </>
  )
}
