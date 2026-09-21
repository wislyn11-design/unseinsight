"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LoginModal } from "@/app/components/layout/login-modal";
import { createClient } from "@/app/lib/supabase/client";

type LoginButtonProps = {
  onUserChange?: (user: User | null) => void;
};

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

      if (nextUser) setIsModalOpen(false);
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