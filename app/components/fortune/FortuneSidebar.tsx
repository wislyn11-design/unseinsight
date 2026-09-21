"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Menu } from "lucide-react";

type MenuItem = {
  label: string;
  href: string;
  icon: ReactNode;
  comingSoon?: boolean;
};

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    sun: (
      <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" />
      </>
    ),
    profile: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <circle cx="12" cy="9" r="2.2" />
        <path d="M8.5 17c.6-2.2 1.8-3.3 3.5-3.3s2.9 1.1 3.5 3.3" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 7h14a2 2 0 0 1 2 2v10H6a2 2 0 0 1-2-2V5.5A2.5 2.5 0 0 1 6.5 3H17" />
        <path d="M15 11h6v4h-6a2 2 0 0 1 0-4Z" />
      </>
    ),
    child: (
      <>
        <circle cx="12" cy="7.5" r="3.2" />
        <path d="M7.2 21v-3.3c0-3 2.1-5.4 4.8-5.4s4.8 2.4 4.8 5.4V21M8.2 15.1 4.5 18M15.8 15.1l3.7 2.9M10 21v-3M14 21v-3" />
      </>
    ),
    health: (
      <>
        <path d="M20 5.8a5 5 0 0 0-7.1 0L12 6.7l-.9-.9A5 5 0 0 0 4 12.9L12 21l8-8.1a5 5 0 0 0 0-7.1Z" />
        <path d="M6.8 12h3l1.3-2.5 2.1 5 1.2-2.5h2.8" />
      </>
    ),
    heart: (
      <path d="M20 5.8a5 5 0 0 0-7.1 0L12 6.7l-.9-.9A5 5 0 0 0 4 12.9L12 21l8-8.1a5 5 0 0 0 0-7.1Z" />
    ),
    people: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="8" r="3" />
        <path d="M2.5 20a5.5 5.5 0 0 1 11 0M10.5 20a5.5 5.5 0 0 1 11 0" />
      </>
    ),
    doc: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[26px] w-[26px]"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const MENUS: MenuItem[] = [
  { label: "오늘의 운세", href: "/fortune/today", icon: <Icon name="sun" /> },
  { label: "사주총평", href: "/fortune/saju", icon: <Icon name="profile" /> },
  { label: "재물운", href: "/fortune/wealth", icon: <Icon name="wallet" /> },
  {
    label: "자녀운",
    href: "/fortune/children",
    icon: <Icon name="child" />,
    comingSoon: true,
  },
  {
    label: "건강운",
    href: "/fortune/health",
    icon: <Icon name="health" />,
    comingSoon: true,
  },
  { label: "연애운", href: "/fortune/love", icon: <Icon name="heart" /> },
  {
    label: "궁합",
    href: "/fortune/compatibility",
    icon: <Icon name="people" />,
  },
  { label: "토정비결", href: "/fortune/tojeong", icon: <Icon name="doc" /> },
];

function SidebarBody({
  open,
  onToggle,
  onNavigate,
}: {
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div
      className={`flex h-full flex-col bg-white py-3 ${open ? "px-3" : "px-2"}`}
    >
      <div className={`mb-3 flex h-12 items-center ${open ? "px-2" : "justify-center"}`}>
        <button
          type="button"
          onClick={onToggle}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[#263149] transition hover:bg-[#f1f5fb]"
          aria-label={open ? "운세 메뉴 접기" : "운세 메뉴 펼치기"}
          aria-expanded={open}
          aria-controls="fortune-sidebar"
        >
          <Menu className="h-7 w-7" aria-hidden="true" />
        </button>
        {open && <span className="ml-3 text-[17px] font-bold text-[#15213b]">메뉴</span>}
      </div>

      <nav className="space-y-2" aria-label="운세 서비스 메뉴">
        {MENUS.map((menu) => {
          const active = pathname === menu.href;
          const menuClassName = `flex h-[62px] w-full items-center rounded-xl text-[17px] font-semibold transition ${open ? "gap-4 px-4" : "justify-center px-0"} ${active ? "bg-gradient-to-r from-[#edf3ff] to-[#f2efff] text-[#1760ee]" : menu.comingSoon ? "cursor-not-allowed text-[#8d98aa]" : "text-[#263149] hover:bg-[#f7f9fc]"}`;

          const menuContent = (
            <>
              <span
                className={
                  active
                    ? "text-[#1760ee]"
                    : menu.comingSoon
                      ? "text-[#9aa5b6]"
                      : "text-[#23314c]"
                }
              >
                {menu.icon}
              </span>
              {open && (
                <>
                  <span className="whitespace-nowrap">{menu.label}</span>
                  {menu.comingSoon && (
                    <span className="ml-auto rounded-full bg-[#eef1f6] px-2 py-0.5 text-[11px] font-bold text-[#7f8999]">
                      준비중
                    </span>
                  )}
                </>
              )}
            </>
          );

          if (menu.comingSoon) {
            return (
              <button
                key={menu.href}
                type="button"
                disabled
                aria-disabled="true"
                title={`${menu.label} (준비중)`}
                className={menuClassName}
              >
                {menuContent}
              </button>
            );
          }

          return (
            <Link
              key={menu.href}
              href={menu.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={!open ? menu.label : undefined}
              className={menuClassName}
            >
              {menuContent}
            </Link>
          );
        })}
      </nav>

      {open && (
        <Link
          href="/fortune/consultation"
          onClick={onNavigate}
          className="mt-4 rounded-[10px] border border-[#9477ff] bg-gradient-to-r from-[#f7f5ff] to-[#f4f7ff] p-4 text-[#2d3551] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl text-[#6c56e8]">✦</span>
            <strong className="text-[16px]">도사님 1:1 상담</strong>
          </div>
          <p className="mt-2 pl-9 text-[12px] font-semibold text-[#7968aa]">
            <span className="mr-1 text-[#7b61ff]">●</span> 상담 가능
          </p>
        </Link>
      )}
    </div>
  );
}

type FortuneSidebarProps = {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
};

export default function FortuneSidebar({
  open,
  onClose,
  onToggle,
}: FortuneSidebarProps) {
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches && open) onClose();
    // 모바일 첫 진입 때 메뉴가 화면을 가리지 않도록 한 번만 실행합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [open, onClose]);

  return (
    <>
      <aside
        id="fortune-sidebar"
        className={`${open ? "md:w-[260px]" : "md:w-[76px]"} sticky top-[74px] hidden h-[calc(100vh-74px)] shrink-0 self-start overflow-hidden border-r border-[#e1e7f0] bg-white transition-[width] duration-300 md:block`}
      >
        <div className={`${open ? "w-[260px]" : "w-[76px]"} h-full overflow-y-auto transition-[width] duration-300`}>
          <SidebarBody open={open} onToggle={onToggle} />
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35"
            onClick={onClose}
            aria-label="운세 메뉴 닫기"
          />
          <aside className="relative h-full w-[min(84vw,300px)] bg-white shadow-2xl">
            <div className="flex h-[58px] items-center justify-end border-b px-4">
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-lg text-2xl"
                aria-label="운세 메뉴 닫기"
              >
                ×
              </button>
            </div>
            <SidebarBody open onToggle={onClose} onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
