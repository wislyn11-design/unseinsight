"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  ACTIVE_SAJU_CLEARED_EVENT,
  saveActiveSajuChart,
  type StoredSajuChart,
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
  const [checkedPath, setCheckedPath] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!guarded) {
      setStatus("ready");
      return;
    }

    const controller = new AbortController();
    setStatus("checking");
    setErrorMessage("");
    setCheckedPath(pathname);

    const checkSaju = async () => {
      try {
        // 접근 여부는 브라우저 캐시가 아닌 현재 로그인 계정의 DB로 판단합니다.
        // 공통 로더의 캐시 삭제 이벤트가 다시 접근 검사를 실행하지 않도록 직접 조회합니다.
        const response = await fetch("/api/saju-charts", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (response.status === 401) {
          throw new Error("로그인 상태를 확인하지 못했습니다. 메인에서 로그인한 뒤 다시 이용해 주세요.");
        }
        if (!response.ok) throw new Error("저장된 사주를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.");
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (data?.success !== true) throw new Error("저장된 사주 조회에 실패했습니다. 다시 확인해 주세요.");

        // 조회에 성공했고 명시적으로 빈 결과일 때만 입력창으로 이동합니다.
        if (data.entry === null) {
          const next = encodeURIComponent(pathname);
          router.replace(`/saju/input?next=${next}`);
          return;
        }
        const entry = data.entry as StoredSajuChart | undefined;
        if (!entry?.chartId || !entry.birthProfileId ||
            !entry.chart?.year?.gan || !entry.chart?.year?.ji ||
            !entry.chart?.month?.gan || !entry.chart?.month?.ji ||
            !entry.chart?.day?.gan || !entry.chart?.day?.ji) {
          throw new Error("저장된 사주 응답을 확인하지 못했습니다. 다시 확인해 주세요.");
        }
        // 저장소를 사용할 수 없어도 DB에서 확인한 회원의 접근은 허용합니다.
        try { saveActiveSajuChart(entry); } catch { /* 다음 페이지에서 DB 재조회 */ }
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(error instanceof Error ? error.message : "잠시 후 다시 확인해 주세요.");
        console.error("활성 사주 확인 오류:", error);
        setStatus("error");
      }
    };

    void checkSaju();

    return () => {
      controller.abort();
    };
  }, [guarded, pathname, retryCount, router]);

  useEffect(() => {
    if (!guarded) return;

    const recheckSavedSaju = () => {
      setStatus("checking");
      setRetryCount((count) => count + 1);
    };

    window.addEventListener(ACTIVE_SAJU_CLEARED_EVENT, recheckSavedSaju);
    return () =>
      window.removeEventListener(ACTIVE_SAJU_CLEARED_EVENT, recheckSavedSaju);
  }, [guarded, pathname]);

  if (!guarded || (checkedPath === pathname && status === "ready")) return children;

  if (checkedPath === pathname && status === "error") {
    return (
      <section className="grid min-h-[calc(100vh-74px)] place-items-center px-6 py-16">
        <div className="max-w-md rounded-3xl border border-[#dce5f5] bg-white px-8 py-9 text-center shadow-sm">
          <h2 className="text-xl font-extrabold text-[#172444]">
            사주 정보를 확인하지 못했습니다
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-[#667085]">
            {errorMessage || "잠시 후 다시 확인해 주세요."}
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
              onClick={() => router.replace("/home")}
              className="rounded-xl border border-[#ccd8ee] bg-white px-5 py-3 font-bold text-[#2e63df]"
            >
              메인으로 돌아가기
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
