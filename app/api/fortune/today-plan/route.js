import { GoogleGenAI } from "@google/genai";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { createClient } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "906229574147";
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const PROMPT_VERSION = "today-plan-v2-incremental";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function configureGoogleCredentials() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;

  const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    JSON.parse(serviceAccountJson);
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

function parseJson(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

function normalizeItems(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 10)
    .map((item) => ({
      task: String(item?.task || "").trim(),
      reason: String(item?.reason || "").trim(),
    }))
    .filter((item) => item.task && item.reason);
}

function normalizeAnalysis(value) {
  const result = {
    summary: String(value?.summary || "").trim(),
    favorable: normalizeItems(value?.favorable),
    caution: normalizeItems(value?.caution),
    postpone: normalizeItems(value?.postpone),
    recommendedOrder: Array.isArray(value?.recommendedOrder)
      ? value.recommendedOrder
          .slice(0, 10)
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      : [],
  };

  const categorizedCount =
    result.favorable.length + result.caution.length + result.postpone.length;
  if (
    !result.summary ||
    categorizedCount === 0 ||
    result.recommendedOrder.length === 0
  ) {
    throw new Error("계획 분석 응답 형식이 올바르지 않습니다.");
  }
  return result;
}

function compactJson(value, maxLength = 18000) {
  const text = JSON.stringify(value || {});
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

async function getOwnedChart(supabase, userId, chartId) {
  const { data, error } = await supabase
    .from("saju_charts")
    .select("*")
    .eq("id", chartId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function findPlanAnalysis(supabase, userId, plan, chartId, date) {
  const hashes = [PROMPT_VERSION, "today-plan-v1"].map((version) =>
    createHash("sha256").update(`${chartId}|${date}|${plan.plan_text.trim()}|${version}`).digest("hex"));
  const { data, error } = await supabase.from("daily_plan_analyses").select("analysis")
    .eq("user_id", userId).eq("plan_id", plan.id).in("input_hash", hashes)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data?.analysis || null;
}

export async function GET(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const chartId = String(url.searchParams.get("chartId") || "").trim();
    const date = String(url.searchParams.get("date") || "").trim();
    if (!chartId || !DATE_PATTERN.test(date)) {
      return Response.json(
        { success: false, error: "만세력 ID와 날짜를 확인해 주세요." },
        { status: 400 },
      );
    }

    const ownedChart = await getOwnedChart(supabase, user.id, chartId);
    if (!ownedChart) {
      return Response.json(
        { success: false, error: "본인의 만세력 정보를 찾을 수 없습니다." },
        { status: 403 },
      );
    }

    const { data: plan, error: planError } = await supabase
      .from("daily_plans")
      .select("id, plan_date, plan_text, created_at, updated_at")
      .eq("user_id", user.id)
      .eq("chart_id", chartId)
      .eq("plan_date", date)
      .maybeSingle();
    if (planError) throw planError;

    let analysis = null;
    if (plan?.id) {
      analysis = await findPlanAnalysis(supabase, user.id, plan, chartId, date);
    }

    return Response.json({
      success: true,
      plan: plan
        ? {
            id: plan.id,
            date: plan.plan_date,
            planText: plan.plan_text,
            updatedAt: plan.updated_at,
          }
        : null,
      analysis,
    });
  } catch (error) {
    console.error("오늘의 계획 불러오기 오류:", error);
    return Response.json(
      { success: false, error: "오늘의 계획을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const chartId = String(body?.chartId || "").trim();
    const date = String(body?.date || "").trim();
    const planText = String(body?.planText || "").trim();

    if (!chartId || !DATE_PATTERN.test(date)) {
      return Response.json(
        { success: false, error: "만세력 ID와 날짜를 확인해 주세요." },
        { status: 400 },
      );
    }
    if (!planText || planText.length > 2000 || planText.split("\n").filter((line) => line.trim()).length > 10) {
      return Response.json(
        { success: false, error: "오늘 할 일을 2,000자 이내로 적어주세요." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const ownedChart = await getOwnedChart(supabase, user.id, chartId);
    if (!ownedChart) {
      return Response.json(
        { success: false, error: "본인의 만세력 정보를 찾을 수 없습니다." },
        { status: 403 },
      );
    }

    const { data: storedDaily } = await supabase
      .from("saju_interpretations")
      .select("structured_result")
      .eq("user_id", user.id)
      .eq("saju_chart_id", chartId)
      .eq("interpretation_type", "daily")
      .eq("period_key", date)
      .in("quality_status", ["validated", "expert_reviewed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const fortuneContext =
      storedDaily?.structured_result || body?.fortuneContext || {};
    const inputHash = createHash("sha256")
      .update(`${chartId}|${date}|${planText}|${PROMPT_VERSION}`)
      .digest("hex");

    // Reuse only server-owned results for unchanged tasks.
    const { data: previousPlan, error: previousPlanError } = await supabase
      .from("daily_plans").select("id, plan_text")
      .eq("user_id", user.id).eq("chart_id", chartId).eq("plan_date", date).maybeSingle();
    if (previousPlanError) throw previousPlanError;
    let previousAnalysis = null;
    if (previousPlan) {
      previousAnalysis = await findPlanAnalysis(supabase, user.id, previousPlan, chartId, date);
    }
    const tasks = planText.split("\n").map((task) => task.trim()).filter(Boolean);
    const buckets = ["favorable", "caution", "postpone"];
    const retained = { favorable: [], caution: [], postpone: [] };
    const retainedTasks = new Set();
    for (const key of buckets) {
      for (const item of normalizeItems(previousAnalysis?.[key])) {
        if (tasks.includes(item.task) && !retainedTasks.has(item.task)) {
          retained[key].push(item);
          retainedTasks.add(item.task);
        }
      }
    }
    const pendingTasks = [...new Set(tasks.filter((task) => !retainedTasks.has(task)))];
    let analysis = null;
    if (!pendingTasks.length) {
      analysis = { ...retained, summary: "저장된 일정별 점보기 결과를 확인해 주세요.", recommendedOrder: tasks };
    }
    if (!analysis) {
      configureGoogleCredentials();
      const ai = new GoogleGenAI({
        vertexai: true,
        project: PROJECT_ID,
        location: LOCATION,
      });

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: `당신은 명리학 자료를 일상 계획에 연결하는 신중한 한국어 조언자입니다.

아래의 저장된 만세력 정보와 해당 날짜의 운세 맥락을 참고해 사용자가 적은 일을 분류하세요.
명리학은 확정적 예언이 아니라 판단을 돕는 참고 자료로만 사용합니다.
건강·법률·투자·안전과 관련된 결정을 단정하거나 보장하지 마세요.
사용자가 적지 않은 일을 새로 만들어내지 마세요. 같은 일은 한 범주에만 넣으세요.
모든 입력 일정을 빠짐없이 한 번씩 분류하고 task는 입력 문구 그대로 복사하세요.
이유는 각 1~2문장으로 쉽고 구체적으로 쓰고, 불필요한 한자와 전문용어는 피하세요.

[날짜]
${date}

[사용자가 적은 오늘의 계획]
${pendingTasks.join("\n")}

[저장된 만세력 정보]
${compactJson(ownedChart)}

[해당 날짜의 오늘 운세 맥락]
${compactJson(fortuneContext)}

다음 JSON만 출력하세요.
{
  "summary": "오늘 계획 전체에 대한 2문장 이내의 핵심 조언",
  "favorable": [{ "task": "사용자가 적은 일", "reason": "해도 좋은 이유와 실행 팁" }],
  "caution": [{ "task": "사용자가 적은 일", "reason": "조심할 점과 안전한 진행 방법" }],
  "postpone": [{ "task": "사용자가 적은 일", "reason": "미루는 편이 나은 이유 또는 미루기 어렵다면 보완 방법" }],
  "recommendedOrder": ["1순위에 해당하는 사용자의 일", "그다음 일"]
}`,
        config: {
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          temperature: 0.25,
        },
      });

      const generated = normalizeAnalysis(parseJson(response.text));
      const generatedTasks = buckets.flatMap((key) => generated[key].map((item) => item.task));
      if (generatedTasks.length !== pendingTasks.length ||
          pendingTasks.some((task) => generatedTasks.filter((value) => value === task).length !== 1) ||
          generatedTasks.some((task) => !pendingTasks.includes(task))) {
        throw new Error("일정별 분석이 누락되었습니다. 다시 저장해 주세요.");
      }
      analysis = {
        summary: "저장된 일정별 점보기 결과를 확인해 주세요.",
        recommendedOrder: tasks,
        ...Object.fromEntries(buckets.map((key) => [key, [...retained[key], ...generated[key]]])),
      };
    }

    const { data: plan, error: planError } = await supabase
      .from("daily_plans")
      .upsert(
        {
          user_id: user.id,
          chart_id: chartId,
          plan_date: date,
          plan_text: planText,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,chart_id,plan_date" },
      )
      .select("id, plan_date, plan_text, updated_at")
      .single();
    if (planError) throw planError;

    const { data: existing, error: cacheError } = await supabase.from("daily_plan_analyses")
      .select("analysis").eq("user_id", user.id).eq("plan_id", plan.id).eq("input_hash", inputHash).maybeSingle();
    if (cacheError) throw cacheError;
    if (existing) {
      analysis = existing.analysis;
    } else {
      const { error: analysisError } = await supabase.from("daily_plan_analyses").insert({
        plan_id: plan.id, user_id: user.id, input_hash: inputHash, analysis,
        model_name: MODEL, prompt_version: PROMPT_VERSION,
      });
      if (analysisError) throw analysisError;
    }

    return Response.json({
      success: true,
      plan: {
        id: plan.id,
        date: plan.plan_date,
        planText: plan.plan_text,
        updatedAt: plan.updated_at,
      },
      analysis,
      reused: pendingTasks.length === 0,
    });
  } catch (error) {
    console.error("오늘의 계획 분석 오류:", error);
    return Response.json(
      {
        success: false,
        error:
          error instanceof SyntaxError
            ? "계획 분석 결과를 해석하지 못했습니다. 다시 시도해 주세요."
            : "오늘의 계획을 분석하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 },
    );
  }
}

// 마지막 일정까지 지운 경우에도 삭제를 명시적으로 저장할 수 있습니다.
export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    const url = new URL(request.url);
    const chartId = String(url.searchParams.get("chartId") || "").trim();
    const date = String(url.searchParams.get("date") || "").trim();
    if (!chartId || !DATE_PATTERN.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
      return Response.json({ success: false, error: "만세력과 날짜를 확인해 주세요." }, { status: 400 });
    }
    const owned = await getOwnedChart(supabase, user.id, chartId);
    if (!owned) return Response.json({ success: false, error: "본인의 만세력 정보를 찾을 수 없습니다." }, { status: 403 });
    const { error } = await supabase.from("daily_plans").delete()
      .eq("user_id", user.id).eq("chart_id", chartId).eq("plan_date", date);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    console.error("오늘 일정 삭제 오류:", error);
    return Response.json({ success: false, error: "일정 삭제를 저장하지 못했습니다." }, { status: 500 });
  }
}
