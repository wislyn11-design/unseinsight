"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Menu } from "lucide-react";

import FortuneSidebar from "@/app/components/fortune/FortuneSidebar";
import FortuneAccessGate from "@/app/components/fortune/FortuneAccessGate";
import { SiteHeader } from "@/app/components/layout/site-header";

type FortuneLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function FortuneLayout({ children }: FortuneLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[#f5f7ff] text-[#14213a]">
      {/* 고정 상단 헤더 */}
      <div className="shrink-0 z-40">
        <SiteHeader />
      </div>

      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-[86px] z-40 grid h-11 w-11 place-items-center rounded-xl border border-[#dce3ed] bg-white text-[#263149] shadow-sm md:hidden"
          aria-label="운세 메뉴 펼치기"
        >
          <Menu className="h-7 w-7" aria-hidden="true" />
        </button>

        {/* 고정 사이드바 */}
        <FortuneSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen((open) => !open)}
        />

        {/* 오른쪽 독립 스크롤 컨텐츠 영역 */}
        <main className="min-w-0 flex-1 overflow-y-auto" id="fortune-content">
          <FortuneAccessGate>{children}</FortuneAccessGate>
        </main>
      </div>
    </div>
  );
}
