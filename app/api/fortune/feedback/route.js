import { createClient } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOPICS = new Set(["overall", "wealth", "love", "workStudy", "health"]);
const ISSUES = new Set(["too_generic", "not_matched", "not_enough_detail", "not_actionable"]);
const HELPFUL_TOPICS = new Set(["matched_me", "specific", "easy_to_understand", "actionable"]);

function cleanList(value, allowed) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(String).filter((item) => allowed.has(item)))];
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(request) {
  try {
    const interpretationId = new URL(request.url).searchParams.get("interpretationId")?.trim();
    if (!interpretationId) {
      return Response.json({ success: false, error: "평가 대상 정보가 없습니다." }, { status: 400 });
    }

    const { supabase, user } = await authenticatedClient();
    if (!user) return Response.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });

    const { data, error } = await supabase.rpc("get_fortune_feedback_status", {
      p_interpretation_id: interpretationId,
    });
    if (error) throw error;

    const status = Array.isArray(data) ? data[0] : data;
    return Response.json({
      success: true,
      evaluated: Boolean(status?.evaluated),
      helpful: status?.helpful ?? null,
      pointBalance: Number(status?.point_balance || 0),
    });
  } catch (error) {
    console.error("오늘의 운세 평가 조회 오류:", error);
    return Response.json({ success: false, error: "평가 상태를 확인하지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const interpretationId = String(body?.interpretationId || "").trim();
    const topic = String(body?.topic || "").trim();
    if (!interpretationId || !TOPICS.has(topic)) {
      return Response.json({ success: false, error: "평가 대상 정보가 올바르지 않습니다." }, { status: 400 });
    }
    if (typeof body?.helpful !== "boolean") {
      return Response.json({ success: false, error: "도움 여부를 선택해 주세요." }, { status: 400 });
    }

    const helpfulTopics = cleanList(body?.helpfulTopics, HELPFUL_TOPICS);
    const issueTypes = cleanList(body?.issueTypes, ISSUES);
    if (body.helpful && helpfulTopics.length !== 1) {
      return Response.json({ success: false, error: "도움이 된 이유를 하나 선택해 주세요." }, { status: 400 });
    }
    if (!body.helpful && issueTypes.length !== 1) {
      return Response.json({ success: false, error: "아쉬운 이유를 하나 선택해 주세요." }, { status: 400 });
    }

    const { supabase, user } = await authenticatedClient();
    if (!user) return Response.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });

    const { data, error } = await supabase.rpc("submit_fortune_feedback", {
      p_interpretation_id: interpretationId,
      p_helpful: body.helpful,
      p_matched_topics: body.helpful ? helpfulTopics : [],
      p_issue_types: body.helpful ? [] : issueTypes,
      p_comment: String(body?.comment || "").trim().slice(0, 500) || null,
    });
    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;
    return Response.json({
      success: true,
      alreadyEvaluated: Boolean(result?.already_evaluated),
      pointsAwarded: Number(result?.points_awarded || 0),
      pointBalance: Number(result?.point_balance || 0),
    });
  } catch (error) {
    console.error("오늘의 운세 평가 저장 오류:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "평가를 저장하지 못했습니다." },
      { status: 500 },
    );
  }
}
