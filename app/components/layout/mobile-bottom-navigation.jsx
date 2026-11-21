"use client";

import Link from "next/link";

function MenuIcon({ kind }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
    {kind === 0 ? <><rect x="3" y="4" width="12" height="16" rx="2" transform="rotate(-12 9 12)" /><path d="m16 4 4 1a2 2 0 0 1 1.5 2.5l-3 12a2 2 0 0 1-2.5 1.5l-2-.5" /></>
      : kind === 1 ? <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>
      : kind === 2 ? <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18m-14 4h.01M12 14h.01M17 14h.01M7 18h.01M12 18h.01" /></>
      : kind === 3 ? <path d="M12 2c1.3 6.2 3.8 8.7 10 10-6.2 1.3-8.7 3.8-10 10C10.7 15.8 8.2 13.3 2 12c6.2-1.3 8.7-3.8 10-10Z" />
      : <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>}
  </svg>;
}

export default function MobileBottomNavigation({ navigation, pathname, primaryCtaHref }) {
  const serviceActive = navigation.some(item => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const items = [...navigation, { label: "내 운세", href: primaryCtaHref }];
  return <nav aria-label="모바일 주요 서비스" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e0e6ef] bg-white lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", boxShadow: "0 -3px 14px rgba(23,53,104,0.04)" }}>
    <div className="mx-auto grid h-[78px] max-w-xl grid-cols-5 items-stretch px-1">
      {items.map((item, index) => {
        const active = index === navigation.length
          ? !serviceActive && (pathname.startsWith("/fortune/") || pathname === "/saju/input")
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-0.5 py-2 text-center text-[13px] font-semibold leading-[1.25] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#2862e3] ${active ? "text-[#2862e3]" : "text-[#526078]"}`}>
          <span className={`flex h-8 w-11 shrink-0 items-center justify-center rounded-full ${active ? "bg-[#eaf1ff]" : ""}`}><MenuIcon kind={index} /></span>
          <span className="whitespace-nowrap tracking-[-.045em]">{item.label}</span>
        </Link>;
      })}
    </div>
  </nav>;
}
