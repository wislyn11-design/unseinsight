"use client";

export const ACTIVE_SAJU_STORAGE_KEY = "unseinsight:lastSaju";
export const ACTIVE_SAJU_CLEARED_EVENT = "unseinsight:active-saju-cleared";
export const PENDING_FORTUNE_PATH_STORAGE_KEY =
  "unseinsight:pendingFortunePath";
export const SAJU_SCHEMA_VERSION = 1 as const;

export type SajuRelationship = "self" | "other";

export type BirthProfileInput = {
  profileName: string;
  relationship: SajuRelationship;
  isSelf: boolean;
  gender: string;
  calendarType: string;
  birthDate: string;
  birthTime: string;
  isLeapMonth: boolean;
  usesEarlyRatHour: boolean;
};

export type SajuPillar = {
  gan: string;
  ji: string;
  [key: string]: unknown;
};

export type SajuChart = {
  year: SajuPillar;
  month: SajuPillar;
  day: SajuPillar;
  hour?: SajuPillar;
  solarDate?: string;
  lunarDate?: string;
  lunarIsLeap?: boolean;
  profileName?: string;
  gender?: string;
  birthTime?: string;
  [key: string]: unknown;
};

export type StoredSajuChart = {
  schemaVersion: typeof SAJU_SCHEMA_VERSION;
  engineVersion: string;
  calculatedAt: string;
  birthProfile: BirthProfileInput;
  chart: SajuChart;
  birthProfileId?: string;
  chartId?: string;
};

type LooseFormData = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function bool(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function normalizeRelationship(
  relationship: unknown,
  isSelf: unknown,
): SajuRelationship {
  const normalized = text(relationship).toLowerCase();

  if (normalized === "self") return "self";
  if (normalized === "other") return "other";

  return bool(isSelf) ? "self" : "other";
}

function twoDigits(value: unknown) {
  const normalized = text(value).replace(/\D/g, "");
  return normalized ? normalized.padStart(2, "0").slice(-2) : "";
}

function normalizeBirthTime(value: unknown) {
  const raw = text(value).replace(/\D/g, "");
  if (raw.length < 3) return text(value);
  return `${raw.slice(0, 2)}:${raw.slice(2, 4)}`;
}

function profileFromForm(form: LooseFormData = {}, chart?: SajuChart): BirthProfileInput {
  const year = text(form.year || form.birthYear);
  const month = twoDigits(form.month || form.birthMonth);
  const day = twoDigits(form.day || form.birthDay);
  const dateFromForm = [year, month, day].every(Boolean)
    ? `${year}-${month}-${day}`
    : "";

  const relationship = normalizeRelationship(form.relationship, form.isSelf);

  return {
    profileName: text(form.profileName || chart?.profileName) || "내 사주",
    relationship,
    isSelf: relationship === "self",
    gender: text(form.gender || chart?.gender) || "미입력",
    calendarType: text(form.calType || form.calendarType) || "양력",
    birthDate: dateFromForm || text(chart?.solarDate || chart?.lunarDate),
    birthTime: normalizeBirthTime(form.hourInput || form.birthTime || chart?.birthTime),
    isLeapMonth: bool(form.isLeap || form.isLeapMonth || chart?.lunarIsLeap),
    usesEarlyRatHour: bool(form.isYajasi || form.useYajasi || form.usesEarlyRatHour),
  };
}

function isChart(value: unknown): value is SajuChart {
  if (!value || typeof value !== "object") return false;
  const chart = value as Partial<SajuChart>;
  return Boolean(chart.year?.gan && chart.year?.ji && chart.month?.gan && chart.month?.ji && chart.day?.gan && chart.day?.ji);
}

export function createStoredSajuChart(
  chart: SajuChart,
  formData: LooseFormData = {},
): StoredSajuChart {
  if (!isChart(chart)) {
    throw new Error("저장할 만세력의 연주·월주·일주 정보가 올바르지 않습니다.");
  }

  const birthProfileId = text(formData.birthProfileId);

  return {
    schemaVersion: SAJU_SCHEMA_VERSION,
    engineVersion: "manseryeok-v1",
    calculatedAt: new Date().toISOString(),
    birthProfile: profileFromForm(formData, chart),
    chart,
    ...(birthProfileId ? { birthProfileId } : {}),
  };
}

export function saveActiveSajuChart(entry: StoredSajuChart) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACTIVE_SAJU_STORAGE_KEY, JSON.stringify(entry));
}

export function clearActiveSajuChart() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACTIVE_SAJU_STORAGE_KEY);
  window.dispatchEvent(new Event(ACTIVE_SAJU_CLEARED_EVENT));
}

function safePendingPath(value: unknown) {
  if (value === "/home") return "/home";

  if (
    typeof value === "string" &&
    value.startsWith("/fortune/") &&
    !value.startsWith("//")
  ) {
    return value;
  }

  return "";
}

export function savePendingFortunePath(path: string) {
  if (typeof window === "undefined") return;
  const safePath = safePendingPath(path);
  if (!safePath) return;
  sessionStorage.setItem(PENDING_FORTUNE_PATH_STORAGE_KEY, safePath);
}

export function readPendingFortunePath() {
  if (typeof window === "undefined") return "";
  return safePendingPath(
    sessionStorage.getItem(PENDING_FORTUNE_PATH_STORAGE_KEY),
  );
}

export function clearPendingFortunePath() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_FORTUNE_PATH_STORAGE_KEY);
}

export function clearActiveSajuChartIfProfile(birthProfileId: string) {
  if (typeof window === "undefined" || !birthProfileId) return;

  const active = readActiveSajuChart();
  if (active?.birthProfileId === birthProfileId) {
    clearActiveSajuChart();
  }
}

export function readActiveSajuChart(): StoredSajuChart | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(ACTIVE_SAJU_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (
      parsed &&
      typeof parsed === "object" &&
      "schemaVersion" in parsed &&
      "chart" in parsed &&
      isChart((parsed as StoredSajuChart).chart)
    ) {
      const stored = parsed as StoredSajuChart;
      const relationship = normalizeRelationship(
        stored.birthProfile?.relationship,
        stored.birthProfile?.isSelf,
      );
      const normalized = {
        ...stored,
        birthProfile: {
          ...stored.birthProfile,
          relationship,
          isSelf: relationship === "self",
        },
      };

      // relationship이 없던 이전 세션 데이터도 새 형식으로 자동 갱신합니다.
      if (!stored.birthProfile?.relationship) {
        saveActiveSajuChart(normalized);
      }

      return normalized;
    }

    // 이전 버전은 enrichedSaju 자체를 저장했습니다. 자동으로 새 포맷으로 감쌉니다.
    if (isChart(parsed)) {
      const migrated = createStoredSajuChart(parsed, parsed);
      saveActiveSajuChart(migrated);
      return migrated;
    }
  } catch {
    clearActiveSajuChart();
  }

  return null;
}

type LoadActiveSajuChartOptions = {
  requirePersisted?: boolean;
};

export async function loadActiveSajuChart(
  options: LoadActiveSajuChartOptions = {},
): Promise<StoredSajuChart | null> {
  const localEntry = readActiveSajuChart();
  const hasPersistedIds = Boolean(
    localEntry?.birthProfileId && localEntry?.chartId,
  );

  if (localEntry && (!options.requirePersisted || hasPersistedIds)) {
    return localEntry;
  }

  const response = await fetch("/api/saju-charts", { cache: "no-store" });
  if (response.status === 401 || response.status === 404) return null;
  if (!response.ok) throw new Error("저장된 만세력을 불러오지 못했습니다.");

  const data = await response.json();
  const entry = data?.entry as StoredSajuChart | undefined;
  if (!entry || !isChart(entry.chart)) return null;

  saveActiveSajuChart(entry);
  return entry;
}

export async function persistActiveSajuChart(entry: StoredSajuChart) {
  const retryDelays = [0, 1_500, 2_500];

  for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
    const delay = retryDelays[attempt];
    if (delay > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, delay));
    }

    const response = await fetch("/api/saju-charts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });

    if (response.status === 401) {
      return { saved: false, reason: "anonymous" as const };
    }

    const data = await response.json().catch(() => null);

    if (response.ok) {
      if (!data?.birthProfileId || !data?.chartId) {
        throw new Error("만세력은 저장되었지만 DB 연결 ID를 확인하지 못했습니다.");
      }

      const savedEntry: StoredSajuChart = {
        ...entry,
        birthProfileId: data.birthProfileId,
        chartId: data.chartId,
      };

      saveActiveSajuChart(savedEntry);

      return {
        saved: true,
        reason: "authenticated" as const,
        birthProfileId: data.birthProfileId as string,
        chartId: data.chartId as string,
      };
    }

    const message = String(data?.error || data?.message || "");
    const isJwtClockSkew =
      data?.code === "PGRST303" &&
      message.toLowerCase().includes("jwt issued at future");

    // OAuth 직후 Auth와 Data API 사이에 짧은 시간 차이가 생길 수 있습니다.
    // 이 오류에 한해서만 잠시 기다린 뒤 같은 저장 요청을 다시 보냅니다.
    if (isJwtClockSkew && attempt < retryDelays.length - 1) {
      continue;
    }

    throw new Error(message || "만세력을 저장하지 못했습니다.");
  }

  throw new Error("만세력을 저장하지 못했습니다.");
}
