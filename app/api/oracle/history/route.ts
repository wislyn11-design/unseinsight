import { NextResponse } from "next/server";

import { findOracleCard } from "@/app/lib/oracle/cards";
import { createClient } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAGE_SIZE = 10;

type HistoryRow = {
  id: string;
  question_text: string;
  current_card_id: string | null;
  future_card_id: string | null;
  current_reading: string | null;
  future_reading: string | null;
  summary_reading: string | null;
  resolution_window: string | null;
  timing_basis: string | null;
  timing_confidence: string | null;
  saju_timing_context: unknown;
  created_at: string;
  completed_at: string | null;
};

type DeleteRequest = {
  id?: unknown;
};

function toHistoryReading(row: HistoryRow) {
  const currentCard = row.current_card_id ? findOracleCard(row.current_card_id) : null;
  const futureCard = row.future_card_id ? findOracleCard(row.future_card_id) : null;

  return {
    id: row.id,
    question: row.question_text,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    currentCard: currentCard
      ? { id: currentCard.id, title: currentCard.title, keywords: currentCard.keywords, image: currentCard.image }
      : null,
    futureCard: futureCard
      ? { id: futureCard.id, title: futureCard.title, keywords: futureCard.keywords, image: futureCard.image }
      : null,
    currentReading: row.current_reading,
    futureReading: row.future_reading,
    summaryReading: row.summary_reading,
    timing: row.resolution_window && row.timing_basis
      ? {
          window: row.resolution_window,
          basis: row.timing_basis,
          confidence: row.timing_confidence,
          sajuConnected: row.saju_timing_context !== null,
        }
      : null,
  };
}

const HISTORY_COLUMNS = [
  "id",
  "question_text",
  "current_card_id",
  "future_card_id",
  "current_reading",
  "future_reading",
  "summary_reading",
  "resolution_window",
  "timing_basis",
  "timing_confidence",
  "saju_timing_context",
  "created_at",
  "completed_at",
].join(",");

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "로그인 후 지난 점괘를 확인해 주세요." }, { status: 401 });
    }

    const url = new URL(request.url);
    const readingId = url.searchParams.get("id")?.trim() ?? "";

    if (readingId) {
      if (!UUID_PATTERN.test(readingId)) {
        return NextResponse.json({ error: "점괘 기록 정보가 올바르지 않습니다." }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("oracle_readings")
        .select(HISTORY_COLUMNS)
        .eq("id", readingId)
        .eq("user_id", user.id)
        .eq("generation_status", "completed")
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "완료된 점괘 기록을 찾을 수 없습니다." }, { status: 404 });
      }

      return NextResponse.json({ reading: toHistoryReading(data as unknown as HistoryRow) });
    }

    const requestedPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("oracle_readings")
      .select(HISTORY_COLUMNS, { count: "exact" })
      .eq("user_id", user.id)
      .eq("generation_status", "completed")
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[oracle] Failed to load reading history", error);
      return NextResponse.json({ error: "지난 점괘를 불러오지 못했습니다." }, { status: 500 });
    }

    const total = count ?? 0;
    return NextResponse.json({
      readings: (data ?? []).map((row) => toHistoryReading(row as unknown as HistoryRow)),
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    console.error("[oracle] Reading history error", error);
    return NextResponse.json({ error: "지난 점괘 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json() as DeleteRequest;
    const readingId = typeof body.id === "string" ? body.id.trim() : "";
    if (!UUID_PATTERN.test(readingId)) {
      return NextResponse.json({ error: "삭제할 점괘 정보가 올바르지 않습니다." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "로그인 후 점괘 기록을 삭제해 주세요." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("oracle_readings")
      .delete()
      .eq("id", readingId)
      .eq("user_id", user.id)
      .eq("generation_status", "completed")
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[oracle] Failed to delete reading history", error);
      return NextResponse.json({ error: "점괘 기록을 삭제하지 못했습니다." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "삭제할 점괘 기록을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[oracle] Reading history delete error", error);
    return NextResponse.json({ error: "점괘 기록 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
