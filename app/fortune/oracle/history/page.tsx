import type { Metadata } from "next";
import { Suspense } from "react";

import OracleHistoryList from "@/app/components/fortune/OracleHistoryList";

export const metadata: Metadata = {
  title: "지난 고민 점괘 | 운세인사이트",
  description: "완료한 고민 점괘의 카드와 풀이를 다시 확인하세요.",
};

export default function OracleHistoryPage() {
  return (
    <Suspense fallback={null}>
      <OracleHistoryList />
    </Suspense>
  );
}
