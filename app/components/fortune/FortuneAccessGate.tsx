"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  ACTIVE_SAJU_CLEARED_EVENT,
  loadActiveSajuChart,
} from "@/app/lib/saju/chart-storage";

type FortuneAccessGateProps = Readonly<{
  children: ReactNode;
}>;

const GUARDED_ROUTES = [
  "/fortune/today",
  "/fortune/manseryeok",
  "/fortune/saju",
  "/fortune/wealth",
  "/fortune/children",
  "/fortune/health",
  "/fortune/love",
  "/fortune/compatibility",
  "/fortune/tojeong",
] as const;

function isGuardedRoute(pathname: string) {
  return GUARDED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export default function FortuneAccessGate({ children }: FortuneAccessGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const guarded = useMemo(() => isGuardedRoute(pathname), [pathname]);
  const [status, setStatus] = useState<"checking" | "ready" | "error">(
    guarded ? "checking" : "ready",
  );
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!guarded) {
      setStatus("ready");
      return;
    }

    let cancelled = false;
    setStatus("checking");

    const checkSaju = async () => {
      try {
        // 운세 API는 DB의 chartId를 사용하므로 임시 세션 사주만으로는 통과시키지 않습니다.
        const activeSaju = await loadActiveSajuChart({ requirePersisted: true });
        if (cancelled) return;

        if (activeSaju) {
          setStatus("ready");
          return;
        }

        const next = encodeURIComponent(pathname);
        router.replace(`/saju/input?next=${next}`);
      } catch (error) {
        if (cancelled) return;
        console.error("활성 사주 확인 오류:", error);
        setStatus("error");
      }
    };

    void checkSaju();

    return () => {
      cancelled = true;
    };
  }, [guarded, pathname, retryCount, router]);

  useEffect(() => {
    if (!guarded) return;

    const redirectToInput = () => {
      const next = encodeURIComponent(pathname);
      router.replace(`/saju/input?next=${next}`);
    };

    window.addEventListener(ACTIVE_SAJU_CLEARED_EVENT, redirectToInput);
    return () =>
      window.removeEventListener(ACTIVE_SAJU_CLEARED_EVENT, redirectToInput);
  }, [guarded, pathname, router]);

  if (!guarded || status === "ready") return children;

  if (status === "error") {
    return (
      <section className="grid min-h-[calc(100vh-74px)] place-items-center px-6 py-16">
        <div className="max-w-md rounded-3xl border border-[#dce5f5] bg-white px-8 py-9 text-center shadow-sm">
          <h2 className="text-xl font-extrabold text-[#172444]">
            사주 정보를 확인하지 못했습니다
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-[#667085]">
            잠시 후 다시 확인하거나 사주정보를 새로 입력해 주세요.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="rounded-xl bg-[#2e63df] px-5 py-3 font-bold text-white"
            >
              다시 확인하기
            </button>
            <button
              type="button"
              onClick={() =>
                router.replace(`/saju/input?next=${encodeURIComponent(pathname)}`)
              }
              className="rounded-xl border border-[#ccd8ee] bg-white px-5 py-3 font-bold text-[#2e63df]"
            >
              사주 입력하기
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="grid min-h-[calc(100vh-74px)] place-items-center px-6 py-16"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center">
        <span className="mx-auto block h-11 w-11 animate-spin rounded-full border-4 border-[#dbe6ff] border-t-[#2e63df]" />
        <p className="mt-5 text-[17px] font-bold text-[#233250]">
          사주 정보를 확인하고 있습니다
        </p>
      </div>
    </section>
  );
}
