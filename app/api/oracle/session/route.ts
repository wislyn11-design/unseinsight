import { NextResponse } from "next/server";

import { ORACLE_CARDS } from "@/app/lib/oracle/cards";
import {
  analyzeOracleQuestion,
  oracleQuestionSimilarity,
  QUESTION_CLASSIFIER_VERSION,
  SIMILAR_QUESTION_THRESHOLD,
} from "@/app/lib/oracle/question-analysis";
import {
  buildOracleTodaySajuContext,
  ORACLE_TODAY_SAJU_CONTEXT_VERSION,
} from "@/app/lib/oracle/today-saju-context.js";
import {
  buildOracleConcernSajuContext,
  ORACLE_CONCERN_SAJU_CONTEXT_VERSION,
} from "@/app/lib/oracle/concern-saju-context.js";
import { createClient } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionRequest = {
  question?: unknown;
  deckOrder?: unknown;
};

type AbandonRequest = {
  sessionId?: unknown;
  action?: unknown;
};

const CARD_IDS = new Set(ORACLE_CARDS.map((card) => card.id));
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const JWT_FUTURE_FIRST_RETRY_MS = 2_000;
const JWT_FUTURE_REFRESH_RETRY_MS = 1_500;

class JwtClockSynchronizationError extends Error {
  constructor() {
    super("JWT clock synchronization failed");
    this.name = "JwtClockSynchronizationError";
  }
}

function isJwtIssuedAtFuture(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const value = error as { code?: unknown; message?: unknown };
  return value.code === "PGRST303"
    && typeof value.message === "string"
    && value.message.toLowerCase().includes("jwt issued at future");
}

function isMissingStage4OracleSchema(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const value = error as { code?: unknown; message?: unknown; details?: unknown };
  const message = [value.message, value.details]
    .filter((item): item is string => typeof item === "string")
    .join(" ")
    .toLowerCase();
  const stage4Columns = [
    "reading_scope",
    "saju_timing_context",
    "timing_context_version",
    "resolution_window",
    "timing_basis",
    "timing_confidence",
  ];
  return value.code === "PGRST204"
    || value.code === "42703"
    || (message.includes("schema cache") && stage4Columns.some((column) => message.includes(column)))
    || stage4Columns.some((column) => message.includes(`column '${column}'`));
}

function embeddedSupabaseError(value: unknown) {
  if (!value || typeof value !== "object" || !("error" in value)) return null;
  return (value as { error?: unknown }).error ?? null;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function withJwtClockRecovery<T>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  operation: () => PromiseLike<T>,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await operation();
      const resultError = embeddedSupabaseError(result);
      if (!isJwtIssuedAtFuture(resultError)) return result;
    } catch (error) {
      if (!isJwtIssuedAtFuture(error)) throw error;
    }

    if (attempt === 0) {
      // OAuth 직후 Auth 서버와 DB 서버 사이에 아주 짧은 시각 차이가 생기면
      // 같은 토큰을 잠시 뒤 다시 확인하는 것만으로 정상 처리됩니다.
      await wait(JWT_FUTURE_FIRST_RETRY_MS);
      continue;
    }

    if (attempt === 1) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw new JwtClockSynchronizationError();
      await wait(JWT_FUTURE_REFRESH_RETRY_MS);
      continue;
    }

    throw new JwtClockSynchronizationError();
  }

  throw new JwtClockSynchronizationError();
}

function seoulDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function validDeckOrder(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length === ORACLE_CARDS.length
    && new Set(value).size === ORACLE_CARDS.length
    && value.every((cardId) => typeof cardId === "string" && CARD_IDS.has(cardId));
}

async function loadPrimarySaju(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, today: string) {
  const { data: primaryProfiles, error: profileError } = await supabase
    .from("birth_profiles")
    .select("id, gender, birth_date, birth_time_unknown")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .limit(1);

  if (profileError) throw profileError;
  const profile = primaryProfiles?.[0] ?? null;
  if (!profile) return null;

  const { data: charts, error: chartError } = await supabase
    .from("saju_charts")
    .select("id, birth_profile_id, chart_data, calculated_at")
    .eq("user_id", userId)
    .eq("birth_profile_id", profile.id)
    .order("calculated_at", { ascending: false })
    .limit(1);

  if (chartError) throw chartError;
  const chart = charts?.[0] ?? null;
  if (!chart) return { profile, chart: null, todayContext: null, concernContext: null };

  return {
    profile,
    chart,
    todayContext: buildOracleTodaySajuContext({
      chartData: chart.chart_data,
      profile,
      date: today,
    }),
    concernContext: buildOracleConcernSajuContext({
      chartData: chart.chart_data,
      profile,
      date: today,
    }),
  };
}

async function loadSessionPrerequisites(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  today: string,
) {
  const recentConcernCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [historyResult, primarySaju] = await Promise.all([
    supabase
      .from("oracle_readings")
      .select("id, question_normalized, question_topic, question_intent, generation_status, created_at")
      .eq("user_id", userId)
      .gte("created_at", recentConcernCutoff)
      .in("generation_status", ["current_completed", "future_generating", "completed"])
      .order("created_at", { ascending: false })
      .limit(30),
    loadPrimarySaju(supabase, userId, today),
  ]);

  if (historyResult.error) throw historyResult.error;
  return { previousReadings: historyResult.data ?? [], primarySaju };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as SessionRequest;
    const question = typeof body.question === "string" ? body.question.trim() : "";

    if (question.length < 4 || question.length > 180 || !validDeckOrder(body.deckOrder)) {
      return NextResponse.json({ error: "고민 또는 카드 정보가 올바르지 않습니다." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "로그인 후 고민 점괘를 이용해 주세요." }, { status: 401 });
    }

    const analysis = analyzeOracleQuestion(question);
    const today = seoulDate();
    const { previousReadings, primarySaju } = await withJwtClockRecovery(
      supabase,
      () => loadSessionPrerequisites(supabase, user.id, today),
    );

    const bestMatch = (previousReadings ?? []).reduce<{
      id: string;
      createdAt: string;
      generationStatus: string;
      score: number;
    } | null>((best, row) => {
      const score = oracleQuestionSimilarity(analysis, {
        normalized: row.question_normalized,
        topic: row.question_topic,
        intent: row.question_intent,
      });
      return !best || score > best.score
        ? { id: row.id, createdAt: row.created_at, generationStatus: row.generation_status, score }
        : best;
    }, null);
    const repeated = Boolean(bestMatch && bestMatch.score >= SIMILAR_QUESTION_THRESHOLD);

    const { data: session, error: insertError } = await withJwtClockRecovery(
      supabase,
      () => supabase
        .from("oracle_readings")
        .insert({
          user_id: user.id,
          birth_profile_id: primarySaju?.profile?.id ?? null,
          saju_chart_id: primarySaju?.chart?.id ?? null,
          question_text: question,
          question_normalized: analysis.normalized,
          question_fingerprint: analysis.fingerprint,
          question_topic: analysis.topic,
          question_intent: analysis.intent,
          question_classifier_version: QUESTION_CLASSIFIER_VERSION,
          draw_date: today,
          timezone: "Asia/Seoul",
          deck_order: body.deckOrder,
          reading_scope: "concern",
          prompt_version: "oracle-reading-v4-1-concern-timing",
          generation_status: "question_submitted",
          repeated_of: repeated ? bestMatch!.id : null,
          similarity_score: bestMatch?.score ?? null,
          repeat_warning_shown: repeated,
          training_use_status: "excluded",
          privacy_notice_version: "oracle-privacy-v1",
          today_day_pillar: primarySaju?.todayContext?.today?.dayPillar ?? null,
          today_saju_context: primarySaju?.todayContext ?? null,
          today_context_version: primarySaju?.todayContext
            ? ORACLE_TODAY_SAJU_CONTEXT_VERSION
            : null,
          saju_timing_context: primarySaju?.concernContext ?? null,
          timing_context_version: primarySaju?.concernContext
            ? ORACLE_CONCERN_SAJU_CONTEXT_VERSION
            : null,
        })
        .select("id")
        .single(),
    );

    if (insertError || !session) {
      console.error("[oracle] Failed to create reading session", insertError);
      if (isMissingStage4OracleSchema(insertError)) {
        return NextResponse.json(
          {
            error: "고민 점괘용 DB 업데이트가 아직 적용되지 않았습니다. Supabase에서 oracle-stage4-v10-1-patch.sql을 실행한 뒤 다시 시도해 주세요.",
            code: "ORACLE_STAGE4_SCHEMA_REQUIRED",
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: "점괘 기록을 준비하지 못했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: session.id,
      repeated,
      similarityScore: bestMatch?.score ?? 0,
      previousCreatedAt: repeated ? bestMatch!.createdAt : null,
      previousReadingId: repeated && bestMatch!.generationStatus === "completed" ? bestMatch!.id : null,
    });
  } catch (error) {
    console.error("[oracle] Session creation error", error);
    if (error instanceof JwtClockSynchronizationError || isJwtIssuedAtFuture(error)) {
      return NextResponse.json(
        {
          error: "로그인 정보의 시간 확인이 필요합니다. Windows 날짜와 시간을 자동으로 맞춘 뒤 로그아웃하고 다시 로그인해 주세요.",
          code: "AUTH_CLOCK_SYNC_REQUIRED",
        },
        { status: 401 },
      );
    }
    return NextResponse.json({ error: "점괘 시작 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as AbandonRequest;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    if (!UUID_PATTERN.test(sessionId) || body.action !== "abandon") {
      return NextResponse.json({ error: "요청 정보가 올바르지 않습니다." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const { error } = await supabase
      .from("oracle_readings")
      .update({ generation_status: "abandoned" })
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .eq("generation_status", "question_submitted");

    if (error) {
      console.error("[oracle] Failed to abandon reading session", error);
      return NextResponse.json({ error: "점괘 기록을 정리하지 못했습니다." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[oracle] Session abandon error", error);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
