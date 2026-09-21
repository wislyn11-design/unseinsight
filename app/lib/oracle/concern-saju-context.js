import { getSipseong } from "@/app/lib/saju/sipseong.js";
import { get12un } from "@/app/lib/saju/un12.js";
import { getSeun } from "@/app/lib/saju/seun.js";
import { getWolun } from "@/app/lib/saju/wolun.js";

const CONTEXT_VERSION = "oracle-concern-saju-v1";
const CHEONGAN = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const JIJI = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

function unwrapStoredChart(chartData) {
  if (!chartData || typeof chartData !== "object" || Array.isArray(chartData)) return null;
  return chartData.chart && typeof chartData.chart === "object"
    ? chartData.chart
    : chartData;
}

function validPillar(pillar) {
  return Boolean(pillar && CHEONGAN.includes(pillar.gan) && JIJI.includes(pillar.ji));
}

function parseDate(dateText) {
  if (typeof dateText !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    throw new Error("고민 점괘 기준 날짜가 올바르지 않습니다.");
  }
  const [year, month, day] = dateText.split("-").map(Number);
  return { year, month, day };
}

function birthYearOf(chartData, saju, profile) {
  const candidates = [
    profile?.birth_date,
    profile?.birthDate,
    chartData?.birthProfile?.birthDate,
    saju?.solarDate,
    saju?.lunarDate,
  ];
  for (const value of candidates) {
    const match = typeof value === "string" ? value.match(/^(\d{4})/) : null;
    if (match) return Number(match[1]);
  }
  return null;
}

function decoratePeriod(dayMaster, period) {
  if (!validPillar(period)) return null;
  return {
    gan: period.gan,
    ji: period.ji,
    pillar: `${period.gan}${period.ji}`,
    ganSipseong: getSipseong(dayMaster, period.gan) || "",
    un12: get12un(dayMaster, period.ji) || "",
  };
}

function buildDaeun(saju, birthYear, year) {
  const daeuns = Array.isArray(saju?.daeun?.daeuns) ? saju.daeun.daeuns : [];
  if (!birthYear || daeuns.length === 0) return null;

  const traditionalAge = year - birthYear + 1;
  const index = daeuns.findIndex((period, periodIndex) => {
    const startAge = Number(period?.startAge);
    const nextStartAge = Number(daeuns[periodIndex + 1]?.startAge);
    return Number.isFinite(startAge)
      && traditionalAge >= startAge
      && (!Number.isFinite(nextStartAge) || traditionalAge < nextStartAge);
  });
  if (index < 0) return null;

  const period = daeuns[index];
  const decorated = decoratePeriod(saju.day.gan, period);
  if (!decorated) return null;
  const nextStartAge = Number(daeuns[index + 1]?.startAge);
  const startAge = Number(period.startAge);

  return {
    ...decorated,
    startAge,
    endAge: Number.isFinite(nextStartAge) ? nextStartAge - 1 : null,
    startYear: birthYear + startAge - 1,
    endYear: Number.isFinite(nextStartAge) ? birthYear + nextStartAge - 2 : null,
  };
}

function annualPeriod(dayMaster, year) {
  const period = getSeun(year, 1)?.[0];
  const decorated = decoratePeriod(dayMaster, period);
  return decorated ? { year, ...decorated } : null;
}

function monthlyPeriod(dayMaster, year, month) {
  const annual = getSeun(year, 1)?.[0];
  if (!validPillar(annual)) return null;
  const period = getWolun(year, annual.gan, annual.ji)?.find((item) => Number(item?.month) === month);
  const decorated = decoratePeriod(dayMaster, period);
  return decorated ? { year, month, label: `${year}년 ${month}월`, ...decorated } : null;
}

function timingCandidates(months) {
  const ranges = [];
  const pairs = [[0, 1], [1, 2], [2, 3], [3, 5]];
  for (const [startIndex, endIndex] of pairs) {
    const start = months[startIndex];
    const end = months[endIndex];
    if (start && end) ranges.push(`${start.label}~${end.label}`);
  }
  ranges.push("6개월 이후 또는 조건이 갖춰지는 때");
  ranges.push("사주 시기를 특정하기 어려움");
  return [...new Set(ranges)];
}

export function buildOracleConcernSajuContext({ chartData, profile, date }) {
  const saju = unwrapStoredChart(chartData);
  if (!saju || !validPillar(saju.year) || !validPillar(saju.month) || !validPillar(saju.day)) {
    throw new Error("대표 만세력의 연주·월주·일주 정보가 올바르지 않습니다.");
  }

  const { year, month } = parseDate(date);
  const birthYear = birthYearOf(chartData, saju, profile);
  const months = [];
  for (let offset = 0; offset < 6; offset += 1) {
    const target = new Date(Date.UTC(year, month - 1 + offset, 1));
    const period = monthlyPeriod(saju.day.gan, target.getUTCFullYear(), target.getUTCMonth() + 1);
    if (period) months.push(period);
  }

  const annualYears = [...new Set(months.map((period) => period.year))];
  const annual = annualYears.map((targetYear) => annualPeriod(saju.day.gan, targetYear)).filter(Boolean);

  return {
    version: CONTEXT_VERSION,
    source: "stored-manseryeok-and-existing-luck-cycle-calculators",
    date,
    timezone: "Asia/Seoul",
    natal: {
      yearPillar: `${saju.year.gan}${saju.year.ji}`,
      monthPillar: `${saju.month.gan}${saju.month.ji}`,
      dayPillar: `${saju.day.gan}${saju.day.ji}`,
      dayMaster: saju.day.gan,
      ohaengCount: saju.ohaengCount ?? null,
    },
    currentDaeun: buildDaeun(saju, birthYear, year),
    annual,
    months,
    timingCandidates: timingCandidates(months),
  };
}

export function oracleConcernTimingCandidates(context) {
  return Array.isArray(context?.timingCandidates)
    ? context.timingCandidates.filter((value) => typeof value === "string")
    : ["사주 시기를 특정하기 어려움"];
}

export function formatOracleConcernSajuContext(context) {
  if (!context?.natal?.dayMaster) return null;
  const daeun = context.currentDaeun;
  const daeunText = daeun
    ? `${daeun.pillar} (${daeun.startYear}~${daeun.endYear ?? "이후"}년), 천간 십성 ${daeun.ganSipseong || "정보 없음"}, 12운성 ${daeun.un12 || "정보 없음"}`
    : "저장된 정보만으로 현재 대운을 확정할 수 없음";
  const annualText = Array.isArray(context.annual) && context.annual.length > 0
    ? context.annual.map((item) => `${item.year}년 ${item.pillar}·${item.ganSipseong || "십성 정보 없음"}·${item.un12 || "12운성 정보 없음"}`).join(" / ")
    : "세운 정보 없음";
  const monthText = Array.isArray(context.months) && context.months.length > 0
    ? context.months.map((item) => `${item.label} ${item.pillar}·${item.ganSipseong || "십성 정보 없음"}·${item.un12 || "12운성 정보 없음"}`).join(" / ")
    : "월운 정보 없음";

  return [
    `기준 날짜: ${context.date} (${context.timezone || "Asia/Seoul"})`,
    `원국: 연주 ${context.natal.yearPillar}, 월주 ${context.natal.monthPillar}, 일주 ${context.natal.dayPillar}, 일간 ${context.natal.dayMaster}`,
    `오행 개수: ${context.natal.ohaengCount ? JSON.stringify(context.natal.ohaengCount) : "정보 없음"}`,
    `현재 대운: ${daeunText}`,
    `현재·근접 세운: ${annualText}`,
    `앞으로 6개월 월운: ${monthText}`,
    `선택 가능한 시기 범위: ${oracleConcernTimingCandidates(context).join(" | ")}`,
    `계산 버전: ${context.version}`,
  ].join("\n");
}

export const ORACLE_CONCERN_SAJU_CONTEXT_VERSION = CONTEXT_VERSION;
