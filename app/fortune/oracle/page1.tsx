import type { Metadata } from "next";

import DailyOracleExperience from "@/app/components/fortune/DailyOracleExperience";

export const metadata: Metadata = {
  title: "오늘의 점괘 | 운세인사이트",
  description: "고민을 입력하고 열두 장 중 마음이 가는 점괘 카드를 직접 선택해 보세요.",
};

export default function OraclePage() {
  return <DailyOracleExperience />;
}
