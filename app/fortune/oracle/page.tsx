import type { Metadata } from "next";

import DailyOracleExperience from "@/app/components/fortune/DailyOracleExperience";

export const metadata: Metadata = {
  title: "고민 점괘 | 운세인사이트",
  description: "고민을 입력하고 현재 마음과 미래 흐름을 보여줄 두 장의 카드를 직접 선택해 보세요.",
};

export default function OraclePage() {
  return <DailyOracleExperience />;
}
