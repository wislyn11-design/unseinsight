import type { Metadata } from "next";

import OracleHistoryDetail from "@/app/components/fortune/OracleHistoryDetail";

export const metadata: Metadata = {
  title: "고민 점괘 다시 보기 | 운세인사이트",
  description: "이전에 완료한 고민 점괘와 두 장의 카드 풀이를 다시 확인하세요.",
};

export default async function OracleHistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OracleHistoryDetail readingId={id} />;
}
