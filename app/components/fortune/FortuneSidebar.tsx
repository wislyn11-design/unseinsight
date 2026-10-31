"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { ChevronDown, Menu } from "lucide-react";

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
      className="h-[30px] w-[30px]"
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

const SAJU_SUBMENU_GROUPS = [
  {
    label: "나의 본질",
    items: [
      { id: 1, label: "한눈에 보는 나의 사주" },
      { id: 2, label: "타고난 성격과 기질" },
      { id: 3, label: "나의 강점과 숨은 가능성" },
    ],
  },
  {
    label: "균형과 관계",
    items: [
      { id: 4, label: "주의해야 할 사항" },
      { id: 5, label: "인간관계 방식" },
      { id: 6, label: "오행으로 보는 에너지 균형" },
    ],
  },
  {
    label: "직업·돈·사랑",
    items: [
      { id: 7, label: "일과 직업 성향" },
      { id: 8, label: "돈을 대하는 기본 성향" },
      { id: 9, label: "사랑과 연애의 기본 성향" },
    ],
  },
  {
    label: "현재의 흐름과 조언",
    items: [
      { id: 10, label: "지금까지 이어진 성장 흐름" },
      { id: 11, label: "현재 내가 지나고 있는 시기" },
      { id: 12, label: "나를 위한 실천 조언" },
    ],
  },
];

const SIDEBAR_THUMB_HEIGHT = 96;
const SIDEBAR_TRACK_PADDING = 10;

function SidebarScrollArea({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startY: 0, startScrollTop: 0 });
  const [thumb, setThumb] = useState({ visible: false, top: 0 });

  const updateThumb = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const maxScroll = element.scrollHeight - element.clientHeight;
    const maxThumbTop = Math.max(
      0,
      element.clientHeight - SIDEBAR_THUMB_HEIGHT - SIDEBAR_TRACK_PADDING * 2,
    );
    const top =
      SIDEBAR_TRACK_PADDING +
      (maxScroll > 0 ? (element.scrollTop / maxScroll) * maxThumbTop : 0);

    setThumb({ visible: maxScroll > 2, top });
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return undefined;

    updateThumb();
    element.addEventListener("scroll", updateThumb, { passive: true });
    window.addEventListener("resize", updateThumb);

    const resizeObserver = new ResizeObserver(updateThumb);
    resizeObserver.observe(element);
    if (element.firstElementChild) {
      resizeObserver.observe(element.firstElementChild);
    }

    return () => {
      element.removeEventListener("scroll", updateThumb);
      window.removeEventListener("resize", updateThumb);
      resizeObserver.disconnect();
    };
  }, [updateThumb]);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;

    const element = scrollRef.current;
    if (!element) return;

    const maxScroll = element.scrollHeight - element.clientHeight;
    const maxThumbTop = Math.max(
      1,
      element.clientHeight - SIDEBAR_THUMB_HEIGHT - SIDEBAR_TRACK_PADDING * 2,
    );
    const deltaY = event.clientY - dragRef.current.startY;
    element.scrollTop =
      dragRef.current.startScrollTop + (deltaY / maxThumbTop) * maxScroll;
  };

  return (
    <div className={`relative ${className}`} style={style}>
      <div ref={scrollRef} className="fortune-sidebar-scroll h-full overflow-y-auto">
        {children}
      </div>
      {thumb.visible && (
        <div
          role="scrollbar"
          aria-controls="fortune-sidebar"
          aria-orientation="vertical"
          className="absolute right-[4px] top-0 z-30 w-[6px] cursor-grab touch-none rounded-full bg-[#d5d8de] transition-colors hover:bg-[#b9bec7] active:cursor-grabbing active:bg-[#aeb4be]"
          style={{
            height: `${SIDEBAR_THUMB_HEIGHT}px`,
            transform: `translateY(${thumb.top}px)`,
          }}
          onPointerDown={(event) => {
            const element = scrollRef.current;
            if (!element) return;
            dragRef.current = {
              startY: event.clientY,
              startScrollTop: element.scrollTop,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={handlePointerMove}
        />
      )}
    </div>
  );
}

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
  const sajuActive = pathname === "/fortune/saju";
  const [sajuExpanded, setSajuExpanded] = useState(sajuActive);
  const [openSajuGroups, setOpenSajuGroups] = useState<Set<number>>(
    () => new Set(),
  );

  const toggleSajuGroup = (groupIndex: number) => {
    setOpenSajuGroups((previous) => {
      const next = new Set(previous);
      if (next.has(groupIndex)) next.delete(groupIndex);
      else next.add(groupIndex);
      return next;
    });
  };

  useEffect(() => {
    if (sajuActive) setSajuExpanded(true);
  }, [sajuActive]);

  return (
    <div
      className={`flex min-h-full flex-col bg-white pb-20 pt-4 ${open ? "px-5" : "px-2"}`}
    >
      <div className={`mb-3 flex h-12 items-center ${open ? "px-1" : "justify-center"}`}>
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
        {open && (
          <span
            className="ml-3 font-bold text-[#15213b]"
            style={{ fontSize: "25px", lineHeight: 1.4 }}
          >
            메뉴
          </span>
        )}
      </div>

      <nav className="space-y-1.5" aria-label="운세 서비스 메뉴">
        {MENUS.map((menu) => {
          const active = pathname === menu.href;
          const menuClassName = `flex h-[72px] w-full items-center rounded-[15px] font-semibold transition ${open ? "gap-4 px-5" : "justify-center px-0"} ${active ? "bg-[#eef3ff] text-[#1760ee]" : menu.comingSoon ? "cursor-not-allowed text-[#8d98aa]" : "text-[#263149] hover:bg-[#f7f9fc]"}`;

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
                  <span
                    className="whitespace-nowrap"
                    style={{ fontSize: "24px", lineHeight: 1.45 }}
                  >
                    {menu.label}
                  </span>
                  {menu.comingSoon && (
                    <span
                      className="ml-auto rounded-full bg-[#eef1f6] px-2 py-0.5 font-bold text-[#7f8999]"
                      style={{ fontSize: "15px", lineHeight: 1.35 }}
                    >
                      준비중
                    </span>
                  )}
                </>
              )}
            </>
          );

          if (menu.href === "/fortune/saju") {
            return (
              <div key={menu.href}>
                <div className="relative">
                  <Link
                    href={menu.href}
                    onClick={() => {
                      setSajuExpanded(true);
                      onNavigate?.();
                    }}
                    aria-current={active ? "page" : undefined}
                    title={!open ? menu.label : undefined}
                    className={`${menuClassName} ${open ? "pr-12" : ""}`}
                  >
                    {menuContent}
                  </Link>

                  {open && (
                    <button
                      type="button"
                      onClick={() => setSajuExpanded((value) => !value)}
                      className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-[#66738a] transition hover:bg-white/70 hover:text-[#1760ee]"
                      aria-label={sajuExpanded ? "사주총평 하위 메뉴 접기" : "사주총평 하위 메뉴 펼치기"}
                      aria-expanded={sajuExpanded}
                    >
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${sajuExpanded ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>

                {open && sajuExpanded && (
                  <div className="mb-5 ml-6 mt-2 border-l border-[#d7e2f2] pb-2 pl-5">
                    <Link
                      href="/fortune/saju#saju-life-map"
                      onClick={() => {
                        window.dispatchEvent(new Event("saju:scroll-life-map"));
                        onNavigate?.();
                      }}
                      className="block rounded-[10px] px-3 py-3 font-semibold text-[#315b9f] transition hover:bg-[#f2f6ff] hover:text-[#1760ee]"
                      style={{ fontSize: "23px", lineHeight: 1.5 }}
                    >
                      나의 인생 지도
                    </Link>

                    {SAJU_SUBMENU_GROUPS.map((group, groupIndex) => {
                      const groupOpen = openSajuGroups.has(groupIndex);
                      return (
                        <div key={group.label} className="relative mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              toggleSajuGroup(groupIndex);
                              window.history.replaceState(
                                null,
                                "",
                                `/fortune/saju#saju-insight-${group.items[0].id}`,
                              );
                              window.dispatchEvent(
                                new CustomEvent("saju:open-insight", {
                                  detail: { id: group.items[0].id },
                                }),
                              );
                            }}
                            className="flex min-h-14 w-full items-center justify-between rounded-[10px] px-3 py-3 text-left font-semibold text-[#263754] transition hover:bg-[#f5f7fb] hover:text-[#1760ee]"
                            style={{ fontSize: "23px", lineHeight: 1.5 }}
                            aria-expanded={groupOpen}
                          >
                            <span>{group.label}</span>
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 transition-transform ${groupOpen ? "rotate-180" : ""}`}
                              aria-hidden="true"
                            />
                          </button>

                          {groupOpen && (
                            <div className="relative mb-2 ml-3 border-l border-[#dbe5f3] py-1 pl-4">
                              {group.items.map((item) => (
                                <Link
                                  key={item.id}
                                  href={`/fortune/saju#saju-insight-${item.id}`}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    window.history.replaceState(
                                      null,
                                      "",
                                      `/fortune/saju#saju-insight-${item.id}`,
                                    );
                                    window.dispatchEvent(
                                      new CustomEvent("saju:open-insight", {
                                        detail: { id: item.id },
                                      }),
                                    );
                                    onNavigate?.();
                                  }}
                                  className="relative block min-h-11 rounded-[9px] px-3 py-3 text-[#53627a] transition before:absolute before:-left-[19px] before:top-1/2 before:h-2 before:w-2 before:-translate-y-1/2 before:rounded-full before:bg-[#cad8ed] hover:bg-[#f2f6ff] hover:text-[#1760ee] hover:before:bg-[#6c94df]"
                                  style={{ fontSize: "21px", lineHeight: 1.55 }}
                                >
                                  {item.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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
          className="mt-5 rounded-[12px] border border-[#a58cff] bg-[#f8f7ff] p-4 text-[#2d3551] transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl text-[#6c56e8]">✦</span>
            <strong style={{ fontSize: "21px", lineHeight: 1.4 }}>
              도사님 1:1 상담
            </strong>
          </div>
          <p
            className="mt-2 pl-9 font-semibold text-[#7968aa]"
            style={{ fontSize: "16px", lineHeight: 1.4 }}
          >
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
  const sidebarWidth = open ? "clamp(420px, 26vw, 460px)" : "76px";

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
        className="sticky top-[74px] hidden h-[calc(100vh-74px)] shrink-0 self-start overflow-hidden border-r border-[#e1e7f0] bg-white transition-[width] duration-300 md:block"
        style={{ width: sidebarWidth }}
      >
        <SidebarScrollArea
          className="h-full transition-[width] duration-300"
          style={{ width: sidebarWidth }}
        >
          <SidebarBody open={open} onToggle={onToggle} />
        </SidebarScrollArea>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35"
            onClick={onClose}
            aria-label="운세 메뉴 닫기"
          />
          <aside
            className="relative h-full max-w-[94vw] bg-white shadow-2xl"
            style={{ width: "420px" }}
          >
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
            <SidebarScrollArea className="h-[calc(100%-58px)]">
              <SidebarBody open onToggle={onClose} onNavigate={onClose} />
            </SidebarScrollArea>
          </aside>
        </div>
      )}

      <style jsx global>{`
        .fortune-sidebar-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .fortune-sidebar-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
        }
      `}</style>
    </>
  );
}
