import { GoogleGenAI } from "@google/genai";
import { Lunar, Solar } from "lunar-typescript";
import fs from "fs";
import path from "path";
import { createClient } from "@/app/lib/supabase/server";

import { getSipseong } from "../../../lib/saju/sipseong.js";
import { get12un } from "../../../lib/saju/un12.js";
import { getTransitSinsal } from "../../../lib/saju/sinsal.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "906229574147";
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const DAILY_PROMPT_VERSION = "today-v6.6-concise-3-sentences";
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
  return `당신은 대한민국 최고 수준의 정통 명리학(Myeonglihak) 사주 전문 풀이 상담가입니다.

[DB에 저장된 사용자 만세력 원국]
${JSON.stringify(saju, null, 2)}

[오늘 일진 및 명리적 흐름 기준]
${JSON.stringify(target, null, 2)}

[핵심 명리 풀이 지침]
1. 위 DB 만세력의 일간(日干), 오행(五行)의 상생상극, 십성(十星: 편재/정재/식신/상관/정관/편관 등), 12운성, 신살(神煞) 작용을 정확히 분석하세요.
2. 분석된 명리적 근거(예: 오늘 일진 천간과 내 일간의 십성 관계, 지지 형충파해 및 신살 작용)를 바탕으로, 이용자가 깊이 공감하고 현실에서 즉시 실천할 수 있는 정교한 운세 풀이를 작성하세요.
3. 절대로 문장을 생략하거나 줄이지 말고, 깊고 풍부한 어조로 정성껏 설명하세요.
4. 행운의 색, 행운의 숫자, 추천 활동은 오늘 명리 흐름상 가장 상생을 돕는 단 하나씩만 엄선하세요.
5. 추천 활동은 실제 일상에서 자연스럽게 실천할 수 있는 행동으로 구체적으로 작성하세요. (예: "햇볕을 쬐며 15분 산책하기", "따뜻한 차 마시며 상반기 계획 정리하기")
6. dailyInsight.headline은 24자 이내의 강한 한 문장, scene은 3문장 이내, caution과 prescription은 각각 1문장으로 작성하세요.
7. 각 분야 title은 20자 이내, description은 핵심만 2문장 이내, detail.reason은 명리적 근거를 2문장 이내로 작성하세요.
8. goodActions와 avoidActions는 각각 가장 중요한 행동 하나만 넣고, 각 문장은 45자 이내로 작성하세요.


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
    

    const cacheDiagnostics = {
      hasExisting: Boolean(existingInterpretation),
    
      statusMatches:
        existingInterpretation?.generation_status === "completed",
    
      promptMatches:
        existingInterpretation?.prompt_version === DAILY_PROMPT_VERSION,
    
      modelMatches:
        existingInterpretation?.model_name === MODEL,
    
      sinsalMatches:
        existingInterpretation?.input_snapshot?.target?.sinsalVersion ===
        target.sinsalVersion,
    
      savedStatus:
        existingInterpretation?.generation_status,
    
      savedPromptVersion:
        existingInterpretation?.prompt_version,
    
      currentPromptVersion:
        DAILY_PROMPT_VERSION,
    
      savedModel:
        existingInterpretation?.model_name,
    
      currentModel:
        MODEL,
    
      savedSinsalVersion:
        existingInterpretation?.input_snapshot?.target?.sinsalVersion,
    
      currentSinsalVersion:
        target.sinsalVersion,
    };
    
    console.log("🔥 오늘의 운세 캐시 진단:", cacheDiagnostics);
    
    const cacheMatches =
      existingInterpretation?.prompt_version === DAILY_PROMPT_VERSION &&
      existingInterpretation?.model_name === MODEL &&
      existingInterpretation?.generation_status === "completed" &&
      existingInterpretation?.input_snapshot?.target?.sinsalVersion ===
        target.sinsalVersion;
    
    console.log(
      cacheMatches
        ? "✅ 오늘의 운세 CACHE HIT"
        : "❌ 오늘의 운세 CACHE MISS",
    );

    if (cacheMatches) {
      try {
        validateFortuneShape(cachedFortune);
        return createNdjsonResponse(async (send) => {
          send({ type: "status", stage: "cache", message: LOADING_MESSAGE });
          send({
            type: "complete",
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