import { GoogleGenAI } from "@google/genai";
import { Lunar, Solar } from "lunar-typescript";
import fs from "fs";
import path from "path";
import { createClient } from "@/app/lib/supabase/server";

import { DAILY_PROMPT_VERSION } from "../../../lib/fortune/daily-content-version.js";

import { getSipseong } from "../../../lib/saju/sipseong.js";
import { get12un } from "../../../lib/saju/un12.js";
import { getTransitSinsal } from "../../../lib/saju/sinsal.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "906229574147";
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const LOADING_MESSAGE = "오늘의 흐름을 꼼꼼히 살펴 오늘의 운세를 풀이하고 있습니다.";

const SECTION_KEYS = ["overall", "wealth", "workStudy", "love", "health"];
const CHEONGAN = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const JIJI = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

const GAN_MAP = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};

const JI_MAP = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
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

  const localKeyPath = path.join(process.cwd(), "config", "service-account-key.json");
  if (!fs.existsSync(localKeyPath)) {
    throw new Error("Google Cloud 서비스 계정 키 파일을 찾을 수 없습니다.");
  }
  process.env.GOOGLE_APPLICATION_CREDENTIALS = localKeyPath;
}

function getTodayInKorea() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function parseDate(dateText) {
  if (typeof dateText !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    throw new Error("날짜는 YYYY-MM-DD 형식이어야 합니다.");
  }

  const [year, month, day] = dateText.split("-").map(Number);
  const checkDate = new Date(Date.UTC(year, month - 1, day));
  if (
    checkDate.getUTCFullYear() !== year ||
    checkDate.getUTCMonth() + 1 !== month ||
    checkDate.getUTCDate() !== day
  ) {
    throw new Error("존재하지 않는 날짜입니다.");
  }
  return { year, month, day };
}

function getDayPillarDirect(year, month, day) {
  const base = Date.UTC(2000, 0, 1);
  const target = Date.UTC(year, month - 1, day);
  const differenceInDays = Math.round((target - base) / 86400000);
  const index = ((54 + differenceInDays) % 60 + 60) % 60;
  return { gan: CHEONGAN[index % 10], ji: JIJI[index % 12] };
}

function unwrapStoredChart(chartData) {
  if (!chartData || typeof chartData !== "object" || Array.isArray(chartData)) return null;
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
    if (!pillar || !CHEONGAN.includes(pillar.gan) || !JIJI.includes(pillar.ji)) {
      throw new Error(`DB 만세력의 ${pillarName} 기둥 정보가 올바르지 않습니다.`);
    }
  }
}

function buildTarget(dateText, saju, gender, birthTimeUnknown = false) {
  const { year, month, day } = parseDate(dateText);
  const solar = Solar.fromYmdHms(year, month, day, 12, 0, 0);
  const lunar = Lunar.fromSolar(solar);
  const bazi = lunar.getEightChar();
  const seasonTerm = lunar.getPrevJieQi(true)?.getName?.() || "";

  const yearPillar = {
    gan: GAN_MAP[bazi.getYearGan()] || bazi.getYearGan(),
    ji: JI_MAP[bazi.getYearZhi()] || bazi.getYearZhi(),
  };
  const monthPillar = {
    gan: GAN_MAP[bazi.getMonthGan()] || bazi.getMonthGan(),
    ji: JI_MAP[bazi.getMonthZhi()] || bazi.getMonthZhi(),
  };
  const dayPillar = getDayPillarDirect(year, month, day);

  const hasValidBirthHour =
    !birthTimeUnknown && CHEONGAN.includes(saju.hour?.gan) && JIJI.includes(saju.hour?.ji);

  const transitSinsal = getTransitSinsal(
    {
      yearGan: saju.year.gan,
      yearJi: saju.year.ji,
      monthGan: saju.month.gan,
      monthJi: saju.month.ji,
      dayGan: saju.day.gan,
      dayJi: saju.day.ji,
      hourGan: hasValidBirthHour ? saju.hour.gan : undefined,
      hourJi: hasValidBirthHour ? saju.hour.ji : undefined,
      gender,
    },
    { gan: dayPillar.gan, ji: dayPillar.ji, type: "iljin" },
  );

  const blockingWarnings = (transitSinsal.warnings || []).filter(
    (warning) => !String(warning).includes("성별이 없어"),
  );
  if (blockingWarnings.length > 0) {
    throw new Error(`오늘 신살 계산 입력 검증 실패: ${blockingWarnings.join(" / ")}`);
  }

  return {
    date: dateText,
    timezone: "Asia/Seoul",
    seasonTerm,
    pillars: { year: yearPillar, month: monthPillar, day: dayPillar },
    daySipseong: getSipseong(saju.day.gan, dayPillar.gan),
    dayUn12: get12un(saju.day.gan, dayPillar.ji),
    sinsal: transitSinsal.items.map((item) => item.name),
    sinsalDetails: transitSinsal.items,
    sinsalVersion: transitSinsal.version,
    sinsalWarnings: transitSinsal.warnings || [],
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateSectionShape(section, key) {
  if (!isPlainObject(section)) throw new Error(`Gemini 응답에 ${key} 항목이 없습니다.`);
  if (!Number.isFinite(Number(section.score))) {
    throw new Error(`Gemini 응답의 ${key}.score 형식이 올바르지 않습니다.`);
  }
  if (!isNonEmptyString(section.title) || !isNonEmptyString(section.description)) {
    throw new Error(`Gemini 응답의 ${key} 제목 또는 풀이가 누락되었습니다.`);
  }
  if (!isPlainObject(section.detail)) {
    throw new Error(`Gemini 응답의 ${key}.detail 항목이 누락되었습니다.`);
  }
  if (!isNonEmptyString(section.detail.reason) || !isNonEmptyString(section.detail.flow)) {
    throw new Error(`Gemini 응답의 ${key} 상세 근거 또는 흐름이 누락되었습니다.`);
  }
  if (
    !Array.isArray(section.detail.goodActions) ||
    section.detail.goodActions.length === 0 ||
    section.detail.goodActions.some((item) => !isNonEmptyString(item)) ||
    !Array.isArray(section.detail.avoidActions) ||
    section.detail.avoidActions.length === 0 ||
    section.detail.avoidActions.some((item) => !isNonEmptyString(item))
  ) {
    throw new Error(`Gemini 응답의 ${key} 실천·주의 항목 형식이 올바르지 않습니다.`);
  }
}

function validateFortuneShape(fortune) {
  if (!isPlainObject(fortune)) throw new Error("Gemini 운세 결과가 올바른 객체가 아닙니다.");
  for (const key of SECTION_KEYS) validateSectionShape(fortune[key], key);

  if (!isPlainObject(fortune.dailyInsight)) {
    throw new Error("Gemini 응답에 dailyInsight가 없습니다.");
  }
  for (const key of ["headline", "scene", "reason", "caution", "prescription", "keyword"]) {
    if (!isNonEmptyString(fortune.dailyInsight[key])) {
      throw new Error(`Gemini 응답의 dailyInsight.${key}가 누락되었습니다.`);
    }
  }
  if (
    !Array.isArray(fortune.dailyInsight.doActions) ||
    fortune.dailyInsight.doActions.length === 0 ||
    fortune.dailyInsight.doActions.some((item) => !isNonEmptyString(item))
  ) {
    throw new Error("Gemini 응답의 dailyInsight.doActions 형식이 올바르지 않습니다.");
  }
  if (
    !Array.isArray(fortune.dailyInsight.dontActions) ||
    fortune.dailyInsight.dontActions.length === 0 ||
    fortune.dailyInsight.dontActions.some((item) => !isNonEmptyString(item))
  ) {
    throw new Error("Gemini 응답의 dailyInsight.dontActions 형식이 올바르지 않습니다.");
  }
  if (!Number.isFinite(Number(fortune.dailyInsight.moodScore))) {
    throw new Error("Gemini 응답의 dailyInsight.moodScore 형식이 올바르지 않습니다.");
  }
  if (!isNonEmptyString(fortune.luckyColor)) {
    throw new Error("Gemini 응답에 행운의 색이 없습니다.");
  }
  if (
    !Array.isArray(fortune.luckyNumbers) ||
    fortune.luckyNumbers.length !== 1 ||
    fortune.luckyNumbers.some((number) => !Number.isFinite(Number(number)))
  ) {
    throw new Error("Gemini 응답의 행운의 숫자는 가장 가능성 높은 하나여야 합니다.");
  }
  if (!isNonEmptyString(fortune.recommendedActivity)) {
    throw new Error("Gemini 응답에 추천 활동이 없습니다.");
  }
}

function buildStreamingPrompt(saju, target) {
  return `당신은 제공된 정통 명리학 데이터를 바탕으로 현대인의 하루를 이해하기 쉽게 안내하는 라이프 내비게이터입니다. 분석 근거와 생활 조언의 어휘를 구분하고, 아래의 기존 NDJSON 구조로 응답하세요.

[DB에 저장된 사용자 만세력 원국]
${JSON.stringify(saju, null, 2)}

[오늘 일진 및 명리적 흐름 기준]
${JSON.stringify(target, null, 2)}

[계산 결과 사용 원칙]
1. 위 DB 원국과 오늘 흐름 데이터는 코드가 계산한 입력값입니다. 날짜, 간지, 일간, 십성, 운성, 신살 값을 새로 계산하거나 바꾸지 마세요.
2. 입력에 명시된 관계만 근거로 사용하세요. 입력에 없는 합·충·형·파·해나 용신·희신을 확정하거나 사용자 직업·재산·일정을 지어내지 마세요.
3. 같은 분석으로 본문·조언·근거를 작성하고, "빨리 실행하라"와 "서두르지 말라"처럼 서로 모순되는 행동을 권하지 마세요.

[어휘 분리 - 가장 중요]
1. title, description, advice, detail.flow, detail.goodActions, detail.avoidActions에는 명리학 전문용어와 한자를 쓰지 마세요. dailyInsight의 모든 필드, 추천 활동, 주의사항, 시간대별 안내 등 사용자에게 보여주는 나머지 설명도 쉬운 일상어로 작성하세요.
2. 일간·일진·천간·지지·오행·십성·편관·정재·합충·병술일 등의 전문 개념을 본문에 넣지 마세요. 단, "충분히", "합리적인" 같은 일반 단어의 글자까지 금지하는 것은 아닙니다.
3. 명리학 전문용어와 한자는 각 분야 detail.reason에만 사용하세요. 이 필드가 화면의 '이렇게 풀이했어요'입니다. dailyInsight.reason은 별도 생활 요약이므로 전문용어를 넣지 마세요.
4. detail.reason은 입력 근거와 본문 조언의 연결을 2문장 이내로 설명하세요. 전문용어는 쉬운 뜻을 곁들이고, 한자는 필요할 때만 정확히 병기하세요. 화면에 제목이 이미 있으므로 '[이렇게 풀이했어요]' 문구를 값에 반복하지 마세요.

[생활 언어와 작성 분량]
1. description은 오늘의 분위기, 느낄 수 있는 부담이나 기회, 대처 방향을 쉬운 말로 2문단·총 3~4문장으로 작성하세요. 문단 사이는 JSON 문자열 안의 이스케이프된 줄바꿈으로 표현하고 각 NDJSON 객체는 실제 한 줄을 유지하세요.
2. 나쁜 예: "경금 일간에 병술일로 강한 편관과 충이 겹칩니다."
   좋은 예: "예상하지 못한 요청이나 일정 변화로 부담을 느낄 수 있어요. 중요한 일부터 정리하면 상황을 차분히 풀어가는 데 도움이 됩니다."
3. 첫 문장부터 독자가 이해할 수 있는 생활 상황으로 설명하세요. 자연의 비유는 이해에 도움이 될 때만 짧게 쓰고, 과장된 비유나 추상적인 '에너지' 표현으로 내용을 채우지 마세요.
4. title은 직관적인 15자 이내 제목, detail.flow는 생활에서 적용할 방향 1문장으로 작성하세요. goodActions와 avoidActions에는 각각 구체적인 행동 하나만 넣고 각 문장은 45자 이내로 작성하세요.
5. dailyInsight.headline은 24자 이내, scene은 3문장 이내, caution과 prescription은 각각 1문장으로 작성하세요. dailyInsight.reason도 근거의 생활상 의미를 쉽게 요약하세요.
6. 행운의 색, 숫자, 추천 활동은 기존처럼 각각 하나만 제시하되, 효과·수익·결과를 보장하지 마세요. 추천 활동은 일상에서 실행할 수 있는 행동으로 작성하세요.
7. 미래의 사건, 질병, 손실을 확정하지 말고 가능성과 점검할 행동으로 안내하세요. 불안·공포를 조장하거나 사주만으로 투자·대출·계약 결정을 지시하지 마세요.
8. main_text, good_action, bad_action, technical_explanation 같은 새 필드를 만들지 마세요. 본문은 description, 행동은 detail.goodActions·detail.avoidActions, 전문 근거는 detail.reason에 담고 기존 필드명과 자료형을 유지하세요.

[스트리밍 출력 형식 - NDJSON 7줄]
마크다운 태그, 코드블록(\`\`\`), 기타 설명 문장을 절대 포함하지 마시고, 아래 JSON 객체 7개를 순서대로 한 줄에 하나씩 출력하세요.
1. {"type":"section","key":"overall","value":{"score":0,"title":"","description":"","detail":{"reason":"","flow":"","goodActions":[""],"avoidActions":[""]}}}
2. {"type":"section","key":"wealth","value":{"score":0,"title":"","description":"","detail":{"reason":"","flow":"","goodActions":[""],"avoidActions":[""]}}}
3. {"type":"section","key":"workStudy","value":{"score":0,"title":"","description":"","detail":{"reason":"","flow":"","goodActions":[""],"avoidActions":[""]}}}
4. {"type":"section","key":"love","value":{"score":0,"title":"","description":"","detail":{"reason":"","flow":"","goodActions":[""],"avoidActions":[""]}}}
5. {"type":"section","key":"health","value":{"score":0,"title":"","description":"","detail":{"reason":"","flow":"","goodActions":[""],"avoidActions":[""]}}}
6. {"type":"dailyInsight","value":{"headline":"","scene":"","reason":"","caution":"","prescription":"","doActions":[""],"dontActions":[""],"keyword":"","moodScore":3}}
7. {"type":"extras","value":{"luckyColor":"","luckyNumbers":[0],"recommendedActivity":"","advice":"","caution":"","timeFlow":[],"cautions":[]}}

score와 moodScore는 0~100 또는 1~5 숫자로 작성하세요.`;
}

function extractCompleteJsonObjects(input) {
  let source = input.replace(/^\s*```(?:json|ndjson)?\s*/i, "");
  const objects = [];

  while (source.length > 0) {
    const start = source.indexOf("{");
    if (start < 0) return { objects, rest: source };
    source = source.slice(start);

    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;

    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];

      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }

      if (character === '"') inString = true;
      else if (character === "{") depth += 1;
      else if (character === "}") {
        depth -= 1;
        if (depth === 0) {
          end = index + 1;
          break;
        }
      }
    }

    if (end < 0) return { objects, rest: source };
    objects.push(source.slice(0, end));
    source = source.slice(end);
  }

  return { objects, rest: source };
}

function applyGeminiEvent(fortune, event) {
  if (!isPlainObject(event) || !isNonEmptyString(event.type)) {
    throw new Error("Gemini 스트리밍 응답의 형식이 올바르지 않습니다.");
  }

  if (event.type === "section") {
    if (!SECTION_KEYS.includes(event.key)) {
      throw new Error(`Gemini가 알 수 없는 운세 영역(${event.key})을 반환했습니다.`);
    }
    validateSectionShape(event.value, event.key);
    fortune[event.key] = event.value;
    return { type: "section", key: event.key, value: event.value };
  }

  if (event.type === "dailyInsight") {
    if (!isPlainObject(event.value)) throw new Error("Gemini의 핵심 풀이 형식이 올바르지 않습니다.");
    fortune.dailyInsight = event.value;
    return { type: "dailyInsight", value: event.value };
  }

  if (event.type === "extras") {
    if (!isPlainObject(event.value)) throw new Error("Gemini의 행운 포인트 형식이 올바르지 않습니다.");
    Object.assign(fortune, event.value);
    return { type: "extras", value: event.value };
  }

  throw new Error(`Gemini가 알 수 없는 응답 유형(${event.type})을 반환했습니다.`);
}

async function generateGeminiFortune(ai, saju, target, send) {
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) {
      send({ type: "reset" });
      send({
        type: "status",
        stage: "retrying",
        message: LOADING_MESSAGE,
      });
    }

    try {
      const modelStream = await ai.models.generateContentStream({
        model: MODEL,
        contents: buildStreamingPrompt(saju, target),
        config: {
          thinkingConfig: { thinkingBudget: 256 },
        },
      });

      const fortune = {};
      let buffer = "";
      let parsedEventCount = 0;

      const parseObject = (jsonObject) => {
        const modelEvent = JSON.parse(jsonObject);
        const clientEvent = applyGeminiEvent(fortune, modelEvent);
        parsedEventCount += 1;
        send(clientEvent);
      };

      for await (const chunk of modelStream) {
        const text = chunk.text || "";
        if (!text) continue;
        buffer += text;
        const extracted = extractCompleteJsonObjects(buffer);
        buffer = extracted.rest;
        for (const jsonObject of extracted.objects) parseObject(jsonObject);
      }

      const finalExtracted = extractCompleteJsonObjects(buffer);
      for (const jsonObject of finalExtracted.objects) parseObject(jsonObject);
      const unparsed = finalExtracted.rest.replace(/```\s*$/i, "").trim();
      if (unparsed) {
        throw new Error("Gemini 응답의 JSON 형식을 읽지 못했습니다.");
      }
      if (parsedEventCount !== 7) {
        throw new Error("Gemini 응답 항목이 누락되었습니다.");
      }

      fortune.date = target.date;
      fortune.dayPillar = `${target.pillars.day.gan}${target.pillars.day.ji}`;
      validateFortuneShape(fortune);
      return fortune;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    lastError instanceof Error
      ? `${lastError.message} 다시 시도해 주세요.`
      : "Gemini 운세 생성에 실패했습니다. 다시 시도해 주세요.",
  );
}

function collectContent(fortune) {
  return [
    fortune.dailyInsight?.headline,
    fortune.dailyInsight?.scene,
    fortune.dailyInsight?.reason,
    fortune.overall?.title,
    fortune.overall?.description,
    fortune.wealth?.title,
    fortune.wealth?.description,
    fortune.workStudy?.title,
    fortune.workStudy?.description,
    fortune.love?.title,
    fortune.love?.description,
    fortune.health?.title,
    fortune.health?.description,
    fortune.recommendedActivity,
    fortune.advice,
  ].filter(Boolean).join("\n\n");
}

function createNdjsonResponse(producer) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      void producer(send)
        .catch((error) => {
          console.error("오늘의 운세 스트리밍 오류:", error);
          send({
            type: "error",
            error: error instanceof Error ? error.message : "Gemini 운세 생성에 실패했습니다. 다시 시도해 주세요.",
          });
        })
        .finally(() => controller.close());
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "private, no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

function jsonError(error, status) {
  return Response.json({ success: false, error }, { status });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const chartId = String(body?.chartId || "").trim();
    if (!chartId) return jsonError("만세력 ID가 없습니다. 만세력을 다시 계산해 주세요.", 400);

    const targetDate = body?.date || getTodayInKorea();
    parseDate(targetDate);
    if (targetDate > getTodayInKorea()) {
      return jsonError("내일의 운세는 한국 시간 기준 자정부터 확인할 수 있습니다.", 403);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("로그인이 필요합니다.", 401);

    const { data: ownedChart, error: chartError } = await supabase
      .from("saju_charts")
      .select("id, birth_profile_id, engine_version, chart_data")
      .eq("id", chartId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (chartError) throw chartError;
    if (!ownedChart) return jsonError("본인의 만세력 정보를 찾을 수 없습니다.", 403);

    const saju = unwrapStoredChart(ownedChart.chart_data);
    validateSaju(saju);

    const profilePromise = ownedChart.birth_profile_id
      ? supabase
          .from("birth_profiles")
          .select("id, profile_name, gender, birth_date, birth_time, birth_time_unknown")
          .eq("id", ownedChart.birth_profile_id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const existingPromise = supabase
      .from("saju_interpretations")
      .select("id, structured_result, quality_status, generation_status, prompt_version, model_name, input_snapshot, created_at")
      .eq("user_id", user.id)
      .eq("saju_chart_id", ownedChart.id)
      .eq("interpretation_type", "daily")
      .eq("period_key", targetDate)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const [profileResult, existingResult] = await Promise.all([profilePromise, existingPromise]);
    if (profileResult.error) throw profileResult.error;
    if (existingResult.error) throw existingResult.error;

    const storedEnvelope = ownedChart.chart_data?.birthProfile || {};
    const profile = profileResult.data || storedEnvelope;
    const gender = profile?.gender || saju.gender || "";
    const birthTimeUnknown = Boolean(
      profile?.birth_time_unknown ?? profile?.birthTimeUnknown ?? false,
    );
    const target = buildTarget(targetDate, saju, gender, birthTimeUnknown);
    const existingInterpretation = existingResult.data || null;

    const cachedFortune = existingInterpretation?.structured_result;
   
    
    const cacheMatches =
      existingInterpretation?.prompt_version === DAILY_PROMPT_VERSION &&
      existingInterpretation?.model_name === MODEL &&
      existingInterpretation?.generation_status === "completed" &&
      existingInterpretation?.input_snapshot?.target?.sinsalVersion ===
        target.sinsalVersion;
    
    

    if (cacheMatches) {
      try {
        validateFortuneShape(cachedFortune);
        return createNdjsonResponse(async (send) => {
          send({ type: "status", stage: "cache", message: LOADING_MESSAGE });
          send({
            type: "complete",
            promptVersion: DAILY_PROMPT_VERSION,
            fortune: cachedFortune,
            target,
            interpretationId: existingInterpretation.id,
            reused: true,
          });
        });
      } catch {
        // 형식이 깨진 저장 결과는 표시하지 않고 Gemini에 새로 요청합니다.
      }
    }

    return createNdjsonResponse(async (send) => {
      send({
        type: "status",
        stage: "generating",
        message: LOADING_MESSAGE,
      });

      configureGoogleCredentials();
      const ai = new GoogleGenAI({
        vertexai: true,
        project: PROJECT_ID,
        location: LOCATION,
      });

      const fortune = await generateGeminiFortune(ai, saju, target, send);

      const interpretationPayload = {
        user_id: user.id,
        saju_chart_id: ownedChart.id,
        interpretation_type: "daily",
        period_key: target.date,
        title: fortune.dailyInsight.headline || fortune.overall.title,
        content: collectContent(fortune),
        structured_result: fortune,
        model_name: MODEL,
        prompt_version: DAILY_PROMPT_VERSION,
        engine_version: ownedChart.engine_version || "manseryeok-v1",
        input_snapshot: {
          chartId: ownedChart.id,
          target,
          source: "saju_charts.chart_data",
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

      const { data: saved, error: saveError } = await saveQuery.select("id").single();
      if (saveError) throw saveError;

      send({
        type: "complete",
        promptVersion: DAILY_PROMPT_VERSION,
        fortune,
        target,
        interpretationId: saved.id,
        reused: false,
      });
    });
  } catch (error) {
    console.error("오늘의 운세 API 오류:", error);
    return jsonError(
      error instanceof Error ? error.message : "오늘의 운세 분석 중 오류가 발생했습니다.",
      500,
    );
  }
}