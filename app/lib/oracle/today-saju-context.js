import { getSipseong } from "@/app/lib/saju/sipseong.js";
import { get12un } from "@/app/lib/saju/un12.js";
import { getTransitSinsal } from "@/app/lib/saju/sinsal.js";

const CONTEXT_VERSION = "oracle-today-saju-v1";
const CHEONGAN = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const JIJI = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

function parseDate(dateText) {
  if (typeof dateText !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    throw new Error("오늘의 점괘 날짜가 올바르지 않습니다.");
  }

  const [year, month, day] = dateText.split("-").map(Number);
  const checkDate = new Date(Date.UTC(year, month - 1, day));
  if (
    checkDate.getUTCFullYear() !== year
    || checkDate.getUTCMonth() + 1 !== month
    || checkDate.getUTCDate() !== day
  ) {
    throw new Error("오늘의 점괘 날짜가 존재하지 않습니다.");
  }

  return { year, month, day };
}

function unwrapStoredChart(chartData) {
  if (!chartData || typeof chartData !== "object" || Array.isArray(chartData)) return null;
  return chartData.chart && typeof chartData.chart === "object"
    ? chartData.chart
    : chartData;
}

function getDayPillarDirect(year, month, day) {
  const base = Date.UTC(2000, 0, 1);
  const target = Date.UTC(year, month - 1, day);
  const differenceInDays = Math.round((target - base) / 86400000);
  const index = ((54 + differenceInDays) % 60 + 60) % 60;
  return { gan: CHEONGAN[index % 10], ji: JIJI[index % 12] };
}

function validPillar(pillar) {
  return Boolean(
    pillar
    && CHEONGAN.includes(pillar.gan)
    && JIJI.includes(pillar.ji),
  );
}

export function buildOracleTodaySajuContext({ chartData, profile, date }) {
  const saju = unwrapStoredChart(chartData);
  if (!saju || !validPillar(saju.year) || !validPillar(saju.month) || !validPillar(saju.day)) {
    throw new Error("대표 만세력의 연주·월주·일주 정보가 올바르지 않습니다.");
  }

  const { year, month, day } = parseDate(date);
  const todayPillar = getDayPillarDirect(year, month, day);
  const birthTimeUnknown = Boolean(
    profile?.birth_time_unknown ?? profile?.birthTimeUnknown ?? false,
  );
  const hasBirthHour = !birthTimeUnknown && validPillar(saju.hour);
  const gender = profile?.gender || saju.gender || "";
  const transitSinsal = getTransitSinsal(
    {
      yearGan: saju.year.gan,
      yearJi: saju.year.ji,
      monthGan: saju.month.gan,
      monthJi: saju.month.ji,
      dayGan: saju.day.gan,
      dayJi: saju.day.ji,
      hourGan: hasBirthHour ? saju.hour.gan : undefined,
      hourJi: hasBirthHour ? saju.hour.ji : undefined,
      gender,
    },
    { gan: todayPillar.gan, ji: todayPillar.ji, type: "iljin" },
  );

  const sinsal = [...new Set(
    (transitSinsal.items || []).map((item) => item.name).filter(Boolean),
  )];

  return {
    version: CONTEXT_VERSION,
    source: "today-fortune-calculator",
    date,
    timezone: "Asia/Seoul",
    natal: {
      dayPillar: `${saju.day.gan}${saju.day.ji}`,
      dayMaster: saju.day.gan,
    },
    today: {
      dayPillar: `${todayPillar.gan}${todayPillar.ji}`,
      gan: todayPillar.gan,
      ji: todayPillar.ji,
      sipseong: getSipseong(saju.day.gan, todayPillar.gan),
      un12: get12un(saju.day.gan, todayPillar.ji),
      sinsal,
      sinsalVersion: transitSinsal.version || "",
    },
  };
}

export function formatOracleTodaySajuContext(context) {
  if (!context?.today?.dayPillar || !context?.natal?.dayMaster) return null;

  const sinsalText = Array.isArray(context.today.sinsal) && context.today.sinsal.length > 0
    ? context.today.sinsal.join(", ")
    : "특별히 강조할 신살 없음";

  return [
    `기준 날짜: ${context.date} (${context.timezone || "Asia/Seoul"})`,
    `사용자 원국 일간: ${context.natal.dayMaster} / 원국 일주: ${context.natal.dayPillar}`,
    `오늘 일주: ${context.today.dayPillar}`,
    `오늘 천간과 사용자 일간의 십성 관계: ${context.today.sipseong || "정보 없음"}`,
    `오늘 지지의 12운성: ${context.today.un12 || "정보 없음"}`,
    `오늘 원국과 성립하는 신살: ${sinsalText}`,
    `계산 출처: 기존 오늘의 운세 계산 규칙 / 버전: ${context.version}`,
  ].join("\n");
}

export const ORACLE_TODAY_SAJU_CONTEXT_VERSION = CONTEXT_VERSION;
