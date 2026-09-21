import "server-only";

import { createHash } from "node:crypto";

export const SAJU_FEATURE_SCHEMA_VERSION = 1;
export const SAJU_FEATURE_VERSION = "saju-features-v1.1";

const STEM_META = {
  갑: { element: "木", yinYang: "양" },
  을: { element: "木", yinYang: "음" },
  병: { element: "火", yinYang: "양" },
  정: { element: "火", yinYang: "음" },
  무: { element: "土", yinYang: "양" },
  기: { element: "土", yinYang: "음" },
  경: { element: "金", yinYang: "양" },
  신: { element: "金", yinYang: "음" },
  임: { element: "水", yinYang: "양" },
  계: { element: "水", yinYang: "음" },
};

const BRANCH_META = {
  자: { element: "水", yinYang: "양" },
  축: { element: "土", yinYang: "음" },
  인: { element: "木", yinYang: "양" },
  묘: { element: "木", yinYang: "음" },
  진: { element: "土", yinYang: "양" },
  사: { element: "火", yinYang: "음" },
  오: { element: "火", yinYang: "양" },
  미: { element: "土", yinYang: "음" },
  신: { element: "金", yinYang: "양" },
  유: { element: "金", yinYang: "음" },
  술: { element: "土", yinYang: "양" },
  해: { element: "水", yinYang: "음" },
};

const PILLAR_KEYS = ["year", "month", "day", "hour"];

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isObject(value)) return value;

  return Object.keys(value)
    .sort()
    .reduce((result, key) => {
      result[key] = stableValue(value[key]);
      return result;
    }, {});
}

function stableHash(value) {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function unwrapChart(chartData) {
  if (!isObject(chartData)) {
    throw new Error("만세력 chart_data가 올바른 객체가 아닙니다.");
  }

  return isObject(chartData.chart) ? chartData.chart : chartData;
}

function normalizePillar(pillar, pillarKey) {
  if (!isObject(pillar)) return null;

  const gan = nonEmptyText(pillar.gan);
  const ji = nonEmptyText(pillar.ji);
  if (!gan || !ji) return null;

  return {
    key: pillarKey,
    gan,
    ji,
    ganMeta: STEM_META[gan] || null,
    jiMeta: BRANCH_META[ji] || null,
    sipseong: nonEmptyText(pillar.sipseong) || null,
    jiSipseong: nonEmptyText(pillar.jiSipseong) || null,
    jijanggan: Array.isArray(pillar.jijanggan) ? pillar.jijanggan : [],
    un12: nonEmptyText(pillar.un12) || null,
    un12Self: nonEmptyText(pillar.un12Self) || null,
    naeum: nonEmptyText(pillar.naeum) || null,
    chungHyung: Array.isArray(pillar.chungHyung)
      ? pillar.chungHyung
      : [],
    relationMap: isObject(pillar.relationMap) ? pillar.relationMap : {},
    sinsal: Array.isArray(pillar.sinsal)
      ? pillar.sinsal
      : pillar.sinsal || [],
  };
}

function normalizeDaeun(daeun) {
  if (!isObject(daeun)) return { metadata: {}, sequence: [] };

  const sequence = Array.isArray(daeun.daeuns)
    ? daeun.daeuns.map((item, index) => ({
        index: index + 1,
        ...item,
        ganMeta: STEM_META[nonEmptyText(item?.gan)] || null,
        jiMeta: BRANCH_META[nonEmptyText(item?.ji)] || null,
      }))
    : [];

  const { daeuns: _ignored, ...metadata } = daeun;
  return { metadata, sequence };
}

function makeFactCollector() {
  const facts = [];
  const ids = new Set();

  function addFact(factId, label, value, sourcePath) {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    if (isObject(value) && Object.keys(value).length === 0) return;
    if (ids.has(factId)) throw new Error(`중복된 명리 근거 ID입니다: ${factId}`);

    ids.add(factId);
    facts.push({
      factId,
      label,
      value,
      sourcePath,
      calculator: SAJU_FEATURE_VERSION,
    });
  }

  return { facts, addFact };
}

export function buildSajuFeatureSnapshot(chartData, engineVersion = "manseryeok-v1") {
  const chart = unwrapChart(chartData);
  const validationErrors = [];
  const pillars = {};
  const { facts, addFact } = makeFactCollector();

  for (const pillarKey of PILLAR_KEYS) {
    const pillar = normalizePillar(chart[pillarKey], pillarKey);
    if (!pillar && pillarKey !== "hour") {
      validationErrors.push(`${pillarKey} 기둥의 간지 정보가 누락되었습니다.`);
      continue;
    }
    if (!pillar) continue;

    pillars[pillarKey] = pillar;
    const prefix = `ORIGINAL_${pillarKey.toUpperCase()}`;
    const source = `chart.${pillarKey}`;

    addFact(`${prefix}_PILLAR`, `${pillarKey}주`, `${pillar.gan}${pillar.ji}`, source);
    addFact(`${prefix}_GAN_META`, `${pillarKey}주 천간 오행·음양`, pillar.ganMeta, `${source}.gan`);
    addFact(`${prefix}_JI_META`, `${pillarKey}주 지지 오행·음양`, pillar.jiMeta, `${source}.ji`);
    addFact(`${prefix}_SIPSEONG`, `${pillarKey}주 천간 십성`, pillar.sipseong, `${source}.sipseong`);
    addFact(`${prefix}_JI_SIPSEONG`, `${pillarKey}주 지지 십성`, pillar.jiSipseong, `${source}.jiSipseong`);
    addFact(`${prefix}_JIJANGGAN`, `${pillarKey}주 지장간`, pillar.jijanggan, `${source}.jijanggan`);
    addFact(`${prefix}_UN12`, `${pillarKey}주 12운성`, pillar.un12, `${source}.un12`);
    addFact(`${prefix}_NAEUM`, `${pillarKey}주 납음`, pillar.naeum, `${source}.naeum`);
    addFact(`${prefix}_RELATIONS`, `${pillarKey}주 지지 관계`, {
      chungHyung: pillar.chungHyung,
      relationMap: pillar.relationMap,
    }, source);
    addFact(`${prefix}_SINSAL`, `${pillarKey}주 신살`, pillar.sinsal, `${source}.sinsal`);
  }

  if (!pillars.day) {
    throw new Error("일주 정보가 없어 명리 특징을 만들 수 없습니다.");
  }

  const dayMaster = {
    gan: pillars.day.gan,
    ...pillars.day.ganMeta,
  };
  const monthCommand = {
    monthJi: pillars.month?.ji || null,
    monthJiMeta: pillars.month?.jiMeta || null,
    wolRyeong: nonEmptyText(chart.wolRyeong) || null,
  };

  addFact("ORIGINAL_DAY_MASTER", "일간", dayMaster, "chart.day.gan");
  addFact("ORIGINAL_MONTH_COMMAND", "월지와 사령", monthCommand, "chart.month.ji, chart.wolRyeong");
  addFact("ORIGINAL_OHAENG_COUNT", "원국 오행 개수", chart.ohaengCount, "chart.ohaengCount");
  addFact("ORIGINAL_YEAR_GONGMANG", "년주 공망", chart.yearGongmang, "chart.yearGongmang");
  addFact("ORIGINAL_DAY_GONGMANG", "일주 공망", chart.dayGongmang, "chart.dayGongmang");
  addFact("ORIGINAL_CHEON_EUL", "천을귀인", chart.cheonEul, "chart.cheonEul");

  if (!isObject(chart.ohaengCount)) {
    validationErrors.push("오행 개수(ohaengCount)가 누락되었습니다.");
  }

  const daeun = normalizeDaeun(chart.daeun);
  if (daeun.sequence.length === 0) {
    validationErrors.push("전체 대운 배열(daeun.daeuns)이 누락되었습니다.");
  }

  daeun.sequence.forEach((item, index) => {
    addFact(
      `DAEUN_${String(index + 1).padStart(2, "0")}`,
      `${index + 1}번째 대운`,
      item,
      `chart.daeun.daeuns[${index}]`,
    );
  });

  const originalFeatures = {
    pillars,
    dayMaster,
    monthCommand,
    ohaengCount: isObject(chart.ohaengCount) ? chart.ohaengCount : {},
    gongmang: {
      year: chart.yearGongmang || null,
      day: chart.dayGongmang || null,
    },
    cheonEul: chart.cheonEul || null,
  };

  const daeunFeatures = {
    metadata: daeun.metadata,
    sequence: daeun.sequence,
  };

  const hashTarget = {
    engineVersion,
    originalFeatures,
    daeunFeatures,
  };

  return {
    featureSchemaVersion: SAJU_FEATURE_SCHEMA_VERSION,
    featureVersion: SAJU_FEATURE_VERSION,
    sourceEngineVersion: engineVersion,
    sourceChartHash: stableHash(hashTarget),
    originalFeatures,
    daeunFeatures,
    factCatalog: facts,
    validationStatus: validationErrors.length === 0 ? "validated" : "invalid",
    validationErrors,
  };
}
