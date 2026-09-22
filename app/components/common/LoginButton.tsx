"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LoginModal } from "@/app/components/layout/login-modal";
import { createClient } from "@/app/lib/supabase/client";

type LoginButtonProps = {
  onUserChange?: (user: User | null) => void;
};

const todayFortunePreloadTasks = new Map<string, Promise<void>>();

function getTodayInKorea() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}

function preloadTodayFortune(userId: string) {
  const today = getTodayInKorea();
  if (!today) return;

  const cacheKey = `unseinsight:today-preloaded:${userId}:${today}`;

  try {
    if (sessionStorage.getItem(cacheKey) === "completed") return;
  } catch {
    // 저장소를 사용할 수 없어도 사전 생성은 계속 진행합니다.
  }

  if (todayFortunePreloadTasks.has(cacheKey)) return;

  const task = (async () => {
    try {
      const chartResponse = await fetch("/api/saju-charts", {
        method: "GET",
        cache: "no-store",
      });
      const chartData = await chartResponse.json().catch(() => null);
      const chartId = chartData?.entry?.chartId;

      // 저장된 만세력이 없는 회원은 오늘의 운세 페이지에서 먼저 계산하도록 둡니다.
      if (!chartResponse.ok || !chartData?.success || !chartId) return;

      const fortuneResponse = await fetch("/api/fortune/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, date: today }),
      });

      if (!fortuneResponse.ok) return;

      // 스트리밍 응답을 끝까지 읽어 생성과 DB 저장이 완료되도록 합니다.
      const responseText = await fortuneResponse.text();
      const completed = responseText
        .split("\n")
        .filter(Boolean)
        .some((line) => {
          try {
            return JSON.parse(line)?.type === "complete";
          } catch {
            return false;
          }
        });

      if (!completed) return;

      try {
        sessionStorage.setItem(cacheKey, "completed");
      } catch {
        // 저장에 실패해도 DB에 저장된 운세 결과는 그대로 사용할 수 있습니다.
      }
    } catch (error) {
      // 사전 생성 실패가 로그인과 사이트 이용을 방해하지 않도록 합니다.
      console.error("오늘의 운세 사전 생성 오류:", error);
    }
  })().finally(() => {
    todayFortunePreloadTasks.delete(cacheKey);
  });

  todayFortunePreloadTasks.set(cacheKey, task);
}

export default function LoginButton({ onUserChange }: LoginButtonProps) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!isMounted) return;
      setUser(currentUser);
      onUserChange?.(currentUser);
      setIsLoading(false);

      if (currentUser) preloadTodayFortune(currentUser.id);
    };

    void checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      const nextUser = session?.user ?? null;
      setUser(nextUser);
      onUserChange?.(nextUser);
      setIsLoading(false);

      if (nextUser) {
        setIsModalOpen(false);
        preloadTodayFortune(nextUser.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [onUserChange, supabase]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      onUserChange?.(null);
    } catch (error) {
      console.error("로그아웃 오류:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <button
        type="button"
        disabled
        className="h-11 rounded-xl border border-[#b9c8de] bg-white px-5 text-[15px] font-semibold text-[#7b879a]"
      >
        확인 중...
      </button>
    );
  }

  if (user) {
    const userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.nickname ||
      user.email?.split("@")[0] ||
      "사용자";

    return (
      <div className="flex items-center gap-3">
        <span
          title={user.email ?? ""}
          className="block max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-semibold text-[#26344e]"
        >
          {userName}님
        </span>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="h-11 rounded-xl border border-[#b9c8de] bg-white px-[17px] text-[15px] font-semibold text-[#26344e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? "처리 중..." : "로그아웃"}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="h-11 rounded-xl border border-[#b9c8de] bg-white px-5 text-[15px] font-semibold text-[#26344e]"
      >
        로그인
      </button>

      <LoginModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        nextPath=""
      />
    </>
  );
}
