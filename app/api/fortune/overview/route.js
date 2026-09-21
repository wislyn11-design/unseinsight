import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { createClient } from "@/app/lib/supabase/server";
import {
  buildSajuFeatureSnapshot,
  SAJU_FEATURE_VERSION,
} from "@/app/lib/saju/feature-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "906229574147";
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const VALID_ELEMENTS = ["木", "火", "土", "金", "水"];
const CHEONGAN = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const JIJI = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

const OVERVIEW_SECTIONS = {
  lifeMap: {
    key: "lifeMap",
    label: "나의 인생 지도",
    periodKey: "lifetime:decade-timeline",
    promptVersion: "saju-overview-life-map-v1.0-evidence",
    resultKey: "decades",
    includeSummary: false,
    minParagraphs: 3,
    maxOutputTokens: 16384,
    timelineGuidance: `10대부터 100세 이후까지 정확히 열 개의 연령 구간을 작성하세요.
각 연령대는 그 시기와 실제로 겹치는 전체 대운을 함께 분석하되, 대운이 10세·20세에 정확히 바뀐다고 가정하지 마세요.
eyebrow에는 그 연령대의 핵심 단계명, headline에는 해당 시기를 대표하는 완성된 문장을 작성하세요.
paragraphs는 반드시 '이 시기의 전체 흐름', '일·돈·관계에서 살펴볼 점', '성장과 균형을 위한 방향'의 서로 다른 세 소주제로 작성하세요.
100세 이후는 제공된 대운 데이터 범위를 넘어서는 사실을 만들지 말고, 근거가 있는 범위에서만 신중하게 설명하세요.`,
    items: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(
      (decade) => ({
        id: decade,
        title: decade === 100 ? "100세 이후의 흐름" : `${decade}대의 흐름`,
        guidance:
          decade === 100
            ? "100세 이후의 삶의 주제와 제공된 대운 범위 안에서 살펴볼 안정·관계·생활 방향"
            : `${decade}세부터 ${decade + 9}세까지의 삶의 주제, 겹치는 대운의 작용, 일·돈·관계, 성장과 균형 방향`,
      }),
    ),
  },
  essence: {
    key: "essence",
    label: "나의 본질",
    periodKey: "lifetime",
    promptVersion: "saju-overview-essence-v1.1-evidence",
    resultKey: "essence",
    includeSummary: true,
    items: [
      {
        id: 1,
        title: "한눈에 보는 나의 사주",
        guidance: "사주의 전체 형태, 원국의 중심 구조, 삶의 기본 방향, 전체 대운과 연결되는 성장 흐름",
      },
      {
        id: 2,
        title: "타고난 성격과 기질",
        guidance: "겉으로 보이는 성향, 실제 내면, 감정 처리, 판단과 행동 방식, 관계에서 나타나는 기질",
      },
      {
        id: 3,
        title: "나의 강점과 숨은 가능성",
        guidance: "선천적 강점, 경험으로 발달하는 능력, 아직 드러나지 않은 가능성, 능력이 발휘되는 환경, 강점을 막는 습관과 활용법",
      },
    ],
  },
  balance: {
    key: "balance",
    label: "균형과 관계",
    periodKey: "lifetime:balance",
    promptVersion: "saju-overview-balance-v1.0-evidence",
    resultKey: "stories",
    includeSummary: false,
    items: [
      {
        id: 4,
        title: "주의해야 할 성향",
        guidance: "강점이 과해질 때의 모습, 반복하기 쉬운 어려움, 감정·행동의 방어 패턴, 균형을 회복하는 구체적인 방법",
      },
      {
        id: 5,
        title: "인간관계 방식",
        guidance: "사람과 가까워지는 방식, 신뢰와 표현, 갈등 처리, 관계의 경계, 편안한 관계를 만드는 방법",
      },
      {
        id: 6,
        title: "오행으로 보는 에너지 균형",
        guidance: "DB 오행 개수와 월지·일간·지지 관계를 함께 본 에너지 분포, 과다·부족이 생활에서 나타나는 방식, 현실적인 보완 습관",
      },
    ],
  },
  workMoneyLove: {
    key: "workMoneyLove",
    label: "일·돈·사랑",
    periodKey: "lifetime:work-money-love",
    promptVersion: "saju-overview-work-money-love-v1.0-evidence",
    resultKey: "stories",
    includeSummary: false,
    items: [
      {
        id: 7,
        title: "일과 직업 성향",
        guidance: "일하는 방식, 능력이 잘 발휘되는 환경, 협업과 책임, 의사결정, 전문성을 성장시키는 방향",
      },
      {
        id: 8,
        title: "돈을 대하는 기본 성향",
        guidance: "수입을 만드는 방식, 소비·저축·위험을 대하는 태도, 돈과 안정감의 관계, 관리 시 주의할 습관",
      },
      {
        id: 9,
        title: "사랑과 연애의 기본 성향",
        guidance: "호감과 애정 표현, 정서적 안정 조건, 갈등과 거리 조절, 오래가는 관계를 위한 성장 과제",
      },
    ],
  },
  flow: {
    key: "flow",
    label: "현재의 흐름과 조언",
    periodKey: "lifetime:flow",
    promptVersion: "saju-overview-flow-v1.0-evidence",
    resultKey: "stories",
    includeSummary: false,
    items: [
      {
        id: 10,
        title: "지금까지 이어진 성장 흐름",
        guidance: "원국과 전체 대운을 연결하여 지금의 나를 만든 성장 주제, 반복된 전환의 의미, 현재까지 발달한 힘",
      },
      {
        id: 11,
        title: "현재 내가 지나고 있는 시기",
        guidance: "대운 데이터에 시작 연도·나이 또는 현재 표시가 있을 때만 특정한 현재 흐름, 현재의 기회와 주의점, 다음 단계를 위한 준비",
      },
      {
        id: 12,
        title: "나를 위한 실천 조언",
        guidance: "원국과 대운 전체를 바탕으로 지금 살릴 힘, 내려놓을 습관, 관계·일·생활에서 실행할 수 있는 구체적인 행동",
      },
    ],
  },
};

function configureGoogleCredentials() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;

  const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      JSON.parse(serviceAccountJson);
    } catch {
      throw new Error("GCP_SERVICE_ACCOUNT_KEY가 올바른 JSON 형식이 아닙니다.");
    }

    const temporaryKeyPath = path.join("/tmp", "service-account-key.json");
    fs.writeFileSync(temporaryKeyPath, serviceAccountJson, {
      encoding: "utf8",
      mode: 0o600,
    });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = temporaryKeyPath;
    return;
  }

  const localKeyPath = path.join(
    process.cwd(),
    "config",
    "service-account-key.json",
  );
  if (!fs.existsSync(localKeyPath)) {
    throw new Error("Google Cloud 서비스 계정 키 파일을 찾을 수 없습니다.");
  }
  process.env.GOOGLE_APPLICATION_CREDENTIALS = localKeyPath;
}

function unwrapStoredChart(chartData) {
  if (!chartData || typeof chartData !== "object" || Array.isArray(chartData)) {
    return null;
  }
  return chartData.chart && typeof chartData.chart === "object"
    ? chartData.chart
    : chartData;
}

function validateSaju(saju) {
  if (!saju || typeof saju !== "object" || Array.isArray(saju)) {
    throw new Error("DB에 저장된 만세력 데이터가 없습니다.");
  }

  for (const pillarName of ["year", "month", "day"]) {
    const pillar = saju[pillarName];
    if (
      !pillar ||
      !CHEONGAN.includes(pillar.gan) ||
      !JIJI.includes(pillar.ji)
    ) {
      throw new Error(
        `DB 만세력의 ${pillarName} 기둥 정보가 올바르지 않습니다.`,
      );
    }
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeKeywords(value) {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,\n/|·]+/)
      : [];

  return Array.from(
    new Set(
      candidates
        .map((keyword) =>
          typeof keyword === "string" ? keyword.trim() : "",
        )
        .filter(Boolean),
    ),
  ).slice(0, 3);
}

function makeAvailableFactIds(featureSnapshot) {
  return new Set(
    (Array.isArray(featureSnapshot?.factCatalog)
      ? featureSnapshot.factCatalog
      : []
    )
      .map((fact) => fact?.factId)
      .filter(isNonEmptyString),
  );
}

function validateEvidenceFactIds(
  evidenceFactIds,
  availableFactIds,
  context,
) {
  if (
    !Array.isArray(evidenceFactIds) ||
    evidenceFactIds.length === 0 ||
    evidenceFactIds.length > 12
  ) {
    throw new Error(`${context}의 명리 근거 ID는 1~12개여야 합니다.`);
  }

  const normalized = evidenceFactIds.map((factId) =>
    typeof factId === "string" ? factId.trim() : "",
  );
  if (normalized.some((factId) => !factId)) {
    throw new Error(`${context}에 비어 있는 명리 근거 ID가 있습니다.`);
  }
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`${context}에 중복된 명리 근거 ID가 있습니다.`);
  }

  const unknownIds = normalized.filter(
    (factId) => !availableFactIds.has(factId),
  );
  if (unknownIds.length > 0) {
    throw new Error(
      `${context}가 DB 특징 스냅샷에 없는 근거를 사용했습니다: ${unknownIds.join(", ")}`,
    );
  }
}

function validateSummary(summary, availableFactIds) {
  if (!isPlainObject(summary)) {
    throw new Error("Gemini 사주총평 대표 결과가 올바른 객체가 아닙니다.");
  }
  if (!VALID_ELEMENTS.includes(summary.element)) {
    throw new Error("Gemini 사주총평의 중심 기운이 올바르지 않습니다.");
  }
  if (!isNonEmptyString(summary.sentence)) {
    throw new Error("Gemini 사주총평의 대표 문장이 누락되었습니다.");
  }
  if (normalizeKeywords(summary.keywords).length === 0) {
    throw new Error("Gemini 사주총평의 핵심 키워드가 누락되었습니다.");
  }
  validateEvidenceFactIds(
    summary.evidenceFactIds,
    availableFactIds,
    "Gemini 사주총평 대표 문장",
  );
}

function validateStoryItem(item, expectedItem, availableFactIds, section) {
  const expectedId = expectedItem.id;
  if (!isPlainObject(item) || Number(item.id) !== expectedId) {
    throw new Error(
      `Gemini ${section.label} ${expectedId}번 결과가 올바르지 않습니다.`,
    );
  }
  for (const key of ["eyebrow", "headline", "tip"]) {
    if (!isNonEmptyString(item[key])) {
      throw new Error(
        `Gemini ${section.label} ${expectedId}번의 ${key}가 누락되었습니다.`,
      );
    }
  }
  if (normalizeKeywords(item.keywords).length === 0) {
    throw new Error(
      `Gemini ${section.label} ${expectedId}번의 핵심 키워드가 누락되었습니다.`,
    );
  }
  if (
    !Array.isArray(item.paragraphs) ||
    item.paragraphs.length < (section.minParagraphs || 4) ||
    item.paragraphs.some(
      (paragraph) =>
        !isPlainObject(paragraph) ||
        !isNonEmptyString(paragraph.title) ||
        !isNonEmptyString(paragraph.body),
    )
  ) {
    throw new Error(
      `Gemini ${section.label} ${expectedId}번의 상세 풀이가 충분하지 않습니다.`,
    );
  }
  validateEvidenceFactIds(
    item.evidenceFactIds,
    availableFactIds,
    `Gemini ${section.label} ${expectedId}번`,
  );
  item.paragraphs.forEach((paragraph, paragraphIndex) => {
    validateEvidenceFactIds(
      paragraph.evidenceFactIds,
      availableFactIds,
      `Gemini ${section.label} ${expectedId}번 ${paragraphIndex + 1}번째 상세 풀이`,
    );
  });
}

function getResultStories(result, section) {
  if (!isPlainObject(result)) return null;
  if (Array.isArray(result[section.resultKey])) return result[section.resultKey];

  // 나의 본질 v1.1 캐시와 새 공통 stories 응답을 모두 읽습니다.
  if (section.key === "essence" && Array.isArray(result.stories)) {
    return result.stories;
  }
  return null;
}

function validateOverviewResult(result, featureSnapshot, section) {
  if (!isPlainObject(result)) {
    throw new Error("Gemini 사주총평 결과가 올바른 객체가 아닙니다.");
  }
  const availableFactIds = makeAvailableFactIds(featureSnapshot);
  if (availableFactIds.size === 0) {
    throw new Error("명리 특징 스냅샷에 사용할 수 있는 근거가 없습니다.");
  }
  if (section.includeSummary) {
    validateSummary(result.summary, availableFactIds);
  }

  const stories = getResultStories(result, section);
  if (!Array.isArray(stories) || stories.length !== section.items.length) {
    throw new Error(
      `Gemini ${section.label} 풀이는 ${section.items.length}개여야 합니다.`,
    );
  }
  for (const expectedItem of section.items) {
    const item = stories.find(
      (candidate) => Number(candidate?.id) === expectedItem.id,
    );
    validateStoryItem(item, expectedItem, availableFactIds, section);
  }
}

function buildOutputExample(section) {
  const paragraphCount = section.minParagraphs || 4;
  const stories = section.items.map((item) => ({
    id: item.id,
    eyebrow: "도입 제목",
    headline: `${item.title}의 핵심 대표 문장`,
    keywords: ["키워드1", "키워드2", "키워드3"],
    evidenceFactIds: ["실제 factId"],
    paragraphs: Array.from({ length: paragraphCount }, (_, index) => index + 1).map((number) => ({
      title: `서로 다른 소제목${number}`,
      body: "충분하고 깊이 있는 풀이 원문",
      evidenceFactIds: ["실제 factId"],
    })),
    tip: "나를 위한 구체적인 인사이트 원문",
  }));

  const output = { [section.resultKey]: stories };
  if (section.includeSummary) {
    output.summary = {
      element: "木·火·土·金·水 중 하나",
      sentence: "나를 대표하는 한 문장",
      keywords: ["키워드1", "키워드2", "키워드3"],
      evidenceFactIds: ["실제 factId"],
    };
  }
  return output;
}

function buildOverviewPrompt(featureSnapshot, section) {
  const itemInstructions = section.items
    .map(
      (item) =>
        `${item.id}번 ${item.title}: ${item.guidance}을(를) 포함하세요.`,
    )
    .join("\n");
  const currentYear = new Date().getFullYear();

  return `당신은 대한민국 최고 수준의 정통 명리학 사주 전문 풀이 상담가입니다.

[이번에 작성할 대분류]
${section.label}

[DB 만세력에서 서버가 추출하고 검증한 원국 특징]
${JSON.stringify(featureSnapshot.originalFeatures, null, 2)}

[DB 만세력에서 서버가 추출하고 검증한 전체 대운 특징]
${JSON.stringify(featureSnapshot.daeunFeatures, null, 2)}

[사용 가능한 명리 근거 목록]
${JSON.stringify(featureSnapshot.factCatalog, null, 2)}

[분석 기준 연도]
${currentYear}년

[분석 원칙]
1. 생년월일로 사주팔자를 다시 계산하지 말고, 반드시 위 DB 특징 스냅샷만 사용하세요.
2. 원국의 년주·월주·일주·시주, 오행 개수, 십성, 지장간, 12운성, 납음, 합충형파해 관계, 신살, 공망, 월령과 저장된 전체 대운을 함께 분석하세요.
3. 세운·월운·일진이나 오늘의 운세는 분석하지 마세요.
4. 막연한 칭찬이나 누구에게나 맞는 표현을 피하고, 제공된 원국과 대운의 명리적 특징을 반영하세요.
5. 유료 사주총평에 어울리도록 충분히 깊고 풍부하게 설명하되 같은 말을 반복하지 마세요.
6. 각 상세 본문에는 명리적 근거, 실제 생활에서 드러나는 모습, 균형을 위한 방향을 자연스럽게 연결하세요.
7. 신강·신약, 격국, 용신·희신·기신은 서버가 확정하지 않았으므로 사실처럼 단정하거나 새로 계산하지 마세요.
8. 오행의 개수만 보고 특정 오행이 무조건 좋거나 나쁘다고 단정하지 말고 월지·일간·원국 관계를 함께 살펴보세요.
9. 직업·재물·연애·인생 시기를 운명처럼 확정하거나 성공·부·결혼을 보장하지 마세요.
10. 현재 대운은 대운 데이터에 시작 연도·나이·현재 표시가 있을 때만 ${currentYear}년을 기준으로 특정하세요. 근거가 부족하면 현재 대운을 임의로 추측하지 마세요.
11. 모든 evidenceFactIds에는 [사용 가능한 명리 근거 목록]에 실제 존재하는 factId만 1~12개 넣고 새로운 ID를 만들지 마세요.
12. 각 이야기와 각 paragraph에는 그 내용을 작성할 때 직접 사용한 evidenceFactIds를 각각 넣으세요.
${section.includeSummary ? "13. summary의 중심 기운은 木·火·土·金·水 중 하나를 선택하고 대표 문장과 키워드 세 개에도 직접 사용한 근거 ID를 넣으세요." : ""}

${section.timelineGuidance ? `[인생 지도 전용 기준]\n${section.timelineGuidance}` : ""}

[항목별 작성 기준]
${itemInstructions}
각 항목의 paragraphs는 최소 ${section.minParagraphs || 4}개 이상의 서로 다른 소주제로 작성하세요. body는 한두 문장으로 급하게 끝내지 말고 충분히 풀어서 설명하세요.

[출력 형식]
마크다운, 코드블록, 부가 설명 없이 아래 구조의 JSON 객체 하나만 출력하세요.
화면에는 문자열을 수정하거나 요약하지 않고 그대로 표시하므로 완성된 자연스러운 한국어 문장으로 작성하세요.
${JSON.stringify(buildOutputExample(section), null, 2)}`;
}

function normalizeEvidenceFactIds(evidenceFactIds) {
  return evidenceFactIds.map((factId) => factId.trim());
}

function normalizeStory(item) {
  return {
    id: Number(item.id),
    eyebrow: item.eyebrow.trim(),
    headline: item.headline.trim(),
    keywords: normalizeKeywords(item.keywords),
    evidenceFactIds: normalizeEvidenceFactIds(item.evidenceFactIds),
    paragraphs: item.paragraphs.map((paragraph) => ({
      title: paragraph.title.trim(),
      body: paragraph.body.trim(),
      evidenceFactIds: normalizeEvidenceFactIds(
        paragraph.evidenceFactIds,
      ),
    })),
    tip: item.tip.trim(),
  };
}

function extractFirstJsonObject(text) {
  const source = String(text || "").trim();
  const start = source.indexOf("{");
  if (start < 0) {
    throw new Error("Gemini 사주총평 응답에서 JSON을 찾지 못했습니다.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];

    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  throw new Error("Gemini 사주총평 JSON이 끝까지 완성되지 않았습니다.");
}

function parseGeminiJson(text, featureSnapshot, section) {
  const result = JSON.parse(extractFirstJsonObject(text));
  validateOverviewResult(result, featureSnapshot, section);
  const stories = getResultStories(result, section)
    .slice()
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map(normalizeStory);
  const normalized = { [section.resultKey]: stories };

  if (section.includeSummary) {
    normalized.summary = {
      element: result.summary.element,
      sentence: result.summary.sentence.trim(),
      keywords: normalizeKeywords(result.summary.keywords),
      evidenceFactIds: normalizeEvidenceFactIds(
        result.summary.evidenceFactIds,
      ),
    };
  }
  return normalized;
}

async function generateOverview(ai, featureSnapshot, section) {
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: buildOverviewPrompt(featureSnapshot, section),
        config: {
          thinkingConfig: { thinkingBudget: 2048 },
          maxOutputTokens: section.maxOutputTokens || 12288,
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      });
      return parseGeminiJson(response.text || "", featureSnapshot, section);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    lastError instanceof Error
      ? `${lastError.message} 다시 시도해 주세요.`
      : "Gemini 사주총평 생성에 실패했습니다. 다시 시도해 주세요.",
  );
}

function collectOverviewContent(result, section) {
  const stories = getResultStories(result, section) || [];
  return [
    result.summary?.sentence,
    ...(result.summary?.keywords || []),
    ...stories.flatMap((item) => [
      item.headline,
      ...item.keywords,
      ...item.paragraphs.flatMap((paragraph) => [paragraph.title, paragraph.body]),
      item.tip,
    ]),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function featureSnapshotFromRow(row) {
  return {
    id: row.id,
    featureSchemaVersion: row.feature_schema_version,
    featureVersion: row.feature_version,
    sourceEngineVersion: row.source_engine_version,
    sourceChartHash: row.source_chart_hash,
    originalFeatures: row.original_features,
    daeunFeatures: row.daeun_features,
    factCatalog: row.fact_catalog,
    validationStatus: row.validation_status,
    validationErrors: row.validation_errors,
  };
}

function numericValue(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === "string") {
      const matched = candidate.match(/-?\d+/);
      if (matched) return Number(matched[0]);
    }
  }
  return null;
}

function buildDaeunPeriods(featureSnapshot) {
  const sequence = Array.isArray(featureSnapshot?.daeunFeatures?.sequence)
    ? featureSnapshot.daeunFeatures.sequence
    : [];
  const metadata = isPlainObject(featureSnapshot?.daeunFeatures?.metadata)
    ? featureSnapshot.daeunFeatures.metadata
    : {};
  const metadataStartAge = numericValue(
    metadata.startAge,
    metadata.start_age,
    metadata.daeunStartAge,
    metadata.daeun_start_age,
    metadata.age,
  );

  const prepared = sequence.map((item, index) => {
    const explicitStartAge = numericValue(
      item?.startAge,
      item?.start_age,
      item?.age,
      item?.fromAge,
      item?.from_age,
    );
    const startAge =
      explicitStartAge ??
      (metadataStartAge !== null ? metadataStartAge + index * 10 : null);
    const startYear = numericValue(
      item?.startYear,
      item?.start_year,
      item?.year,
      item?.fromYear,
      item?.from_year,
    );
    const ganji =
      (isNonEmptyString(item?.ganji) && item.ganji.trim()) ||
      `${isNonEmptyString(item?.gan) ? item.gan.trim() : ""}${
        isNonEmptyString(item?.ji) ? item.ji.trim() : ""
      }` ||
      null;

    return {
      factId: `DAEUN_${String(index + 1).padStart(2, "0")}`,
      index: index + 1,
      startAge,
      explicitEndAge: numericValue(
        item?.endAge,
        item?.end_age,
        item?.toAge,
        item?.to_age,
      ),
      startYear,
      explicitEndYear: numericValue(
        item?.endYear,
        item?.end_year,
        item?.toYear,
        item?.to_year,
      ),
      ganji: ganji || null,
    };
  });

  return prepared.map((item, index) => {
    const next = prepared[index + 1];
    const endAge =
      item.explicitEndAge ??
      (item.startAge !== null
        ? next?.startAge !== null && next?.startAge !== undefined
          ? next.startAge - 1
          : item.startAge + 9
        : null);
    const endYear =
      item.explicitEndYear ??
      (item.startYear !== null
        ? next?.startYear !== null && next?.startYear !== undefined
          ? next.startYear - 1
          : item.startYear + 9
        : null);

    return {
      factId: item.factId,
      index: item.index,
      ganji: item.ganji,
      startAge: item.startAge,
      endAge,
      startYear: item.startYear,
      endYear,
    };
  });
}

function featureSnapshotPayload(userId, chartId, snapshot) {
  return {
    user_id: userId,
    saju_chart_id: chartId,
    feature_schema_version: snapshot.featureSchemaVersion,
    feature_version: snapshot.featureVersion,
    source_engine_version: snapshot.sourceEngineVersion,
    source_chart_hash: snapshot.sourceChartHash,
    original_features: snapshot.originalFeatures,
    daeun_features: snapshot.daeunFeatures,
    fact_catalog: snapshot.factCatalog,
    validation_status: snapshot.validationStatus,
    validation_errors: snapshot.validationErrors,
  };
}

async function ensureFeatureSnapshot(
  supabase,
  userId,
  ownedChart,
  generatedSnapshot,
  existingSnapshotRow,
) {
  const existingMatches =
    existingSnapshotRow?.source_chart_hash ===
      generatedSnapshot.sourceChartHash &&
    existingSnapshotRow?.source_engine_version ===
      generatedSnapshot.sourceEngineVersion &&
    existingSnapshotRow?.validation_status ===
      generatedSnapshot.validationStatus &&
    isPlainObject(existingSnapshotRow?.original_features) &&
    isPlainObject(existingSnapshotRow?.daeun_features) &&
    Array.isArray(existingSnapshotRow?.fact_catalog) &&
    existingSnapshotRow.fact_catalog.length > 0;

  if (existingMatches) {
    return featureSnapshotFromRow(existingSnapshotRow);
  }

  const { data, error } = await supabase
    .from("saju_feature_snapshots")
    .upsert(
      featureSnapshotPayload(userId, ownedChart.id, generatedSnapshot),
      { onConflict: "saju_chart_id,feature_version" },
    )
    .select(
      "id, feature_schema_version, feature_version, source_engine_version, source_chart_hash, original_features, daeun_features, fact_catalog, validation_status, validation_errors",
    )
    .single();

  if (error) throw error;
  return featureSnapshotFromRow(data);
}

function jsonError(error, status) {
  return Response.json({ success: false, error }, { status });
}

function publicErrorMessage(error) {
  if (error?.code === "42P01") {
    return "명리 특징 스냅샷 테이블을 찾을 수 없습니다. Supabase SQL을 먼저 실행해 주세요.";
  }
  if (error?.code === "42501") {
    return "명리 특징 스냅샷을 저장할 권한이 없습니다. Supabase RLS 정책을 확인해 주세요.";
  }
  if (
    error?.code === "23514" &&
    String(error?.message || "").includes(
      "saju_interpretations_type_check",
    )
  ) {
    return "사주총평 저장 유형(overall)이 DB에 허용되지 않았습니다.";
  }

  return error instanceof Error
    ? error.message.replace(/Gemini\s*/g, "")
    : "사주총평 대표 풀이 중 오류가 발생했습니다.";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const chartId = String(body?.chartId || "").trim();
    const sectionKey = String(body?.section || "essence").trim();
    const section = OVERVIEW_SECTIONS[sectionKey];
    if (!chartId) {
      return jsonError(
        "만세력 ID가 없습니다. 만세력을 다시 계산해 주세요.",
        400,
      );
    }
    if (!section) {
      return jsonError("지원하지 않는 사주총평 대분류입니다.", 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError("로그인이 필요합니다.", 401);

    const { data: ownedChart, error: chartError } = await supabase
      .from("saju_charts")
      .select("id, engine_version, chart_data")
      .eq("id", chartId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (chartError) throw chartError;
    if (!ownedChart) {
      return jsonError("본인의 만세력 정보를 찾을 수 없습니다.", 403);
    }

    const saju = unwrapStoredChart(ownedChart.chart_data);
    validateSaju(saju);
    const engineVersion =
      ownedChart.engine_version ||
      ownedChart.chart_data?.engineVersion ||
      "manseryeok-v1";
    const generatedFeatureSnapshot = buildSajuFeatureSnapshot(
      ownedChart.chart_data,
      engineVersion,
    );

    const existingPromise = supabase
      .from("saju_interpretations")
      .select(
        "id, structured_result, input_snapshot, generation_status, prompt_version, model_name, created_at",
      )
      .eq("user_id", user.id)
      .eq("saju_chart_id", ownedChart.id)
      .eq("interpretation_type", "overall")
      .eq("period_key", section.periodKey)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const featureSnapshotPromise = supabase
      .from("saju_feature_snapshots")
      .select(
        "id, feature_schema_version, feature_version, source_engine_version, source_chart_hash, original_features, daeun_features, fact_catalog, validation_status, validation_errors",
      )
      .eq("user_id", user.id)
      .eq("saju_chart_id", ownedChart.id)
      .eq("feature_version", SAJU_FEATURE_VERSION)
      .maybeSingle();

    const [existingResult, featureSnapshotResult] = await Promise.all([
      existingPromise,
      featureSnapshotPromise,
    ]);
    if (existingResult.error) throw existingResult.error;
    if (featureSnapshotResult.error) throw featureSnapshotResult.error;

    const featureSnapshot = await ensureFeatureSnapshot(
      supabase,
      user.id,
      ownedChart,
      generatedFeatureSnapshot,
      featureSnapshotResult.data,
    );
    if (featureSnapshot.validationStatus !== "validated") {
      const details = Array.isArray(featureSnapshot.validationErrors)
        ? featureSnapshot.validationErrors.join(" ")
        : "";
      throw new Error(
        `DB 만세력 특징 검증에 실패했습니다.${details ? ` ${details}` : ""}`,
      );
    }

    const existingInterpretation = existingResult.data || null;
    const cachedResult = existingInterpretation?.structured_result;
    const cacheMatches =
      existingInterpretation?.prompt_version === section.promptVersion &&
      existingInterpretation?.model_name === MODEL &&
      existingInterpretation?.generation_status === "completed" &&
      existingInterpretation?.input_snapshot?.featureSnapshotId ===
        featureSnapshot.id &&
      existingInterpretation?.input_snapshot?.featureVersion ===
        featureSnapshot.featureVersion &&
      existingInterpretation?.input_snapshot?.sourceChartHash ===
        featureSnapshot.sourceChartHash;

    if (cacheMatches) {
      try {
        validateOverviewResult(cachedResult, featureSnapshot, section);
        const cachedStories = getResultStories(cachedResult, section);
        return Response.json({
          success: true,
          sectionKey: section.key,
          summary: cachedResult.summary,
          stories: cachedStories,
          ...(section.key === "essence"
            ? { essence: cachedStories }
            : {}),
          ...(section.key === "lifeMap"
            ? {
                timeline: cachedStories,
                daeunPeriods: buildDaeunPeriods(featureSnapshot),
              }
            : {}),
          featureSnapshotId: featureSnapshot.id,
          evidenceTracked: true,
          interpretationId: existingInterpretation.id,
          reused: true,
        });
      } catch {
        // 저장된 결과 형식이 깨졌으면 Gemini로 다시 생성합니다.
      }
    }

    configureGoogleCredentials();
    const ai = new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: LOCATION,
    });
    const result = await generateOverview(ai, featureSnapshot, section);
    const stories = getResultStories(result, section);

    const interpretationPayload = {
      user_id: user.id,
      saju_chart_id: ownedChart.id,
      interpretation_type: "overall",
      period_key: section.periodKey,
      title: result.summary?.sentence || `${section.label} 사주총평`,
      content: collectOverviewContent(result, section),
      structured_result: result,
      model_name: MODEL,
      prompt_version: section.promptVersion,
      engine_version: engineVersion,
      input_snapshot: {
        chartId: ownedChart.id,
        featureSnapshotId: featureSnapshot.id,
        featureSchemaVersion: featureSnapshot.featureSchemaVersion,
        featureVersion: featureSnapshot.featureVersion,
        sourceChartHash: featureSnapshot.sourceChartHash,
        factCount: featureSnapshot.factCatalog.length,
        source: "saju_feature_snapshots",
        sectionKey: section.key,
        scope: ["original_chart", "daeun"],
      },
      generation_status: "completed",
      quality_status: "validated",
      is_training_approved: false,
      user_consent_for_improvement: false,
    };

    const saveQuery = existingInterpretation
      ? supabase
          .from("saju_interpretations")
          .update(interpretationPayload)
          .eq("id", existingInterpretation.id)
          .eq("user_id", user.id)
      : supabase.from("saju_interpretations").insert(interpretationPayload);

    const { data: saved, error: saveError } = await saveQuery
      .select("id")
      .single();
    if (saveError) throw saveError;

    return Response.json({
      success: true,
      sectionKey: section.key,
      summary: result.summary,
      stories,
      ...(section.key === "essence" ? { essence: stories } : {}),
      ...(section.key === "lifeMap"
        ? {
            timeline: stories,
            daeunPeriods: buildDaeunPeriods(featureSnapshot),
          }
        : {}),
      featureSnapshotId: featureSnapshot.id,
      evidenceTracked: true,
      interpretationId: saved.id,
      reused: false,
    });
  } catch (error) {
    console.error("사주총평 대표 풀이 API 오류:", error);
    return jsonError(publicErrorMessage(error), 500);
  }
}
