export type OracleHistoryCard = Readonly<{
  id: string;
  title: string;
  keywords: string;
  image: string;
}>;

export type OracleHistoryReading = Readonly<{
  id: string;
  question: string;
  createdAt: string;
  completedAt: string | null;
  currentCard: OracleHistoryCard | null;
  futureCard: OracleHistoryCard | null;
  currentReading: string | null;
  futureReading: string | null;
  summaryReading: string | null;
  timing: Readonly<{
    window: string;
    basis: string;
    confidence: string | null;
    sajuConnected: boolean;
  }> | null;
}>;

export type OracleHistoryListResponse = {
  readings?: unknown;
  page?: unknown;
  total?: unknown;
  totalPages?: unknown;
  error?: unknown;
};

export type OracleHistoryDetailResponse = {
  reading?: unknown;
  error?: unknown;
};

export function isOracleHistoryReading(value: unknown): value is OracleHistoryReading {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const reading = value as Record<string, unknown>;
  return typeof reading.id === "string"
    && typeof reading.question === "string"
    && typeof reading.createdAt === "string";
}

export function formatOracleHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 정보 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
