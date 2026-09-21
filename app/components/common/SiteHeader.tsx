"use client";

import Link from "next/link";
import { useState } from "react";
import LoginButton from "@/app/components/common/LoginButton";

const navigation = [
  { label: "오늘의 운세", href: "/fortune/today" },
  { label: "사주", href: "/" },
  { label: "궁합", href: "/fortune/compatibility" },
  { label: "토정비결", href: "/fortune/tojeong" },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      {open ? (
        <>
          <path d="m6 6 12 12" />
          <path d="M18 6 6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#dfe5f0] bg-white/95 shadow-[0_2px_10px_rgba(28,45,78,.04)] backdrop-blur">
      <div className="mx-auto flex h-[74px] max-w-[1540px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link
          href="/home"
          className="flex items-center gap-2.5"
          aria-label="운세인사이트 홈"
        >
          <img
            src="/unse-insight-logo.jpg"
            alt=""
            className="h-10 w-10 rounded-xl object-contain"
          />
          <span className="text-[23px] font-extrabold tracking-[-.055em] text-[#071536]">
            운세인사이트
          </span>
        </Link>

        <nav className="hidden items-center gap-[62px] lg:flex" aria-label="주요 메뉴">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[16px] font-semibold text-[#111b35] transition hover:text-[#2f62dc]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LoginButton />
          <Link
            href="/"
            className="flex h-11 items-center rounded-xl bg-[#2e63df] px-6 font-bold text-white shadow-[0_7px_16px_rgba(46,99,223,.24)] transition hover:bg-[#2458d0]"
          >
            무료로 시작하기
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[#17213b] lg:hidden"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
        >
          <MenuIcon open={isMenuOpen} />
        </button>
      </div>

      {isMenuOpen && (
        <nav className="absolute left-0 right-0 top-full flex flex-col gap-1 border-b border-[#dfe5f0] bg-white p-5 shadow-lg lg:hidden">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className="rounded-xl px-4 py-3 font-semibold text-[#111b35] hover:bg-[#f3f6ff]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className="mt-2 rounded-xl bg-[#2e63df] px-4 py-3 text-center font-bold text-white"
          >
            무료로 시작하기
          </Link>
        </nav>
      )}
    </header>
  );
}
