import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

type BirthProfile = {
  profileName?: string;
  relationship?: string;
  isSelf?: boolean;
  gender?: string;
  calendarType?: string;
  birthDate?: string;
  birthTime?: string;
  isLeapMonth?: boolean;
};

type Relationship = "self" | "other";

function validPillar(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const pillar = value as Record<string, unknown>;
  return typeof pillar.gan === "string" && typeof pillar.ji === "string";
}

function normalizeCalendarType(value: unknown): "solar" | "lunar" {
  const calendarType = String(value ?? "").trim().toLowerCase();

  if (["lunar", "음력", "l"].includes(calendarType)) {
    return "lunar";
  }

  return "solar";
}


function normalizeGender(value: unknown): "male" | "female" {
  const gender = String(value ?? "").trim().toLowerCase();

  if (["female", "여", "여자", "여성", "woman", "f"].includes(gender)) {
    return "female";
  }

  if (["male", "남", "남자", "남성", "man", "m"].includes(gender)) {
    return "male";
  }

  throw new Error("성별 값이 올바르지 않습니다.");
}

function normalizeRelationship(
  relationship: unknown,
  isSelf: unknown,
): Relationship {
  const normalized = String(relationship ?? "").trim().toLowerCase();

  if (normalized === "self") return "self";
  if (normalized === "other") return "other";

  return isSelf === true ? "self" : "other";
}


function validateEntry(entry: unknown) {
  if (!entry || typeof entry !== "object") throw new Error("저장할 만세력 데이터가 없습니다.");
  const value = entry as Record<string, any>;
  if (!value.chart || !validPillar(value.chart.year) || !validPillar(value.chart.month) || !validPillar(value.chart.day)) {
    throw new Error("만세력의 연주·월주·일주 정보가 올바르지 않습니다.");
  }
  if (JSON.stringify(value).length > 200_000) throw new Error("만세력 데이터가 너무 큽니다.");
  return value;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });

  const view = new URL(request.url).searchParams.get("view");

  if (view === "profiles") {
    const { data: profiles, error: profilesError } = await supabase
      .from("birth_profiles")
      .select("id, profile_name, relationship, is_primary, gender, calendar_type, birth_date, birth_time, is_leap_month")
      .eq("user_id", user.id)
      .order("is_primary", { ascending: false })
      .order("profile_name", { ascending: true });

    if (profilesError) {
      return Response.json(
        { success: false, error: profilesError.message },
        { status: 500 },
      );
    }

    return Response.json(
      {
        success: true,
        profiles: (profiles || []).map((profile) => {
          // 이전 코드에서 다른 사람도 relationship=self로 저장된 데이터가 있습니다.
          // 실제 대표 본인은 is_primary=true 한 명이므로 이 값을 최종 기준으로 사용합니다.
          const relationship: Relationship = profile.is_primary ? "self" : "other";

          return {
            id: profile.id,
            profileName: profile.profile_name,
            relationship,
            isSelf: relationship === "self",
            isPrimary: Boolean(profile.is_primary),
            gender: normalizeGender(profile.gender),
            calendarType: normalizeCalendarType(profile.calendar_type),
            birthDate: profile.birth_date,
            birthTime: profile.birth_time || "",
            isLeapMonth: Boolean(profile.is_leap_month),
          };
        }),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data, error } = await supabase
    .from("saju_charts")
    .select("id, birth_profile_id, engine_version, calculated_at, chart_data, birth_profiles(profile_name, relationship, gender, calendar_type, birth_date, birth_time, is_leap_month)")
    .eq("user_id", user.id)
    .order("calculated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
  if (!data) return Response.json({ success: false, error: "저장된 만세력이 없습니다." }, { status: 404 });

  const profileValue = Array.isArray(data.birth_profiles) ? data.birth_profiles[0] : data.birth_profiles;
  const profile = profileValue as Record<string, any> | null;
  return Response.json({
    success: true,
    entry: {
      schemaVersion: 1,
      birthProfileId: data.birth_profile_id,
      chartId: data.id,
      engineVersion: data.engine_version,
      calculatedAt: data.calculated_at,
      birthProfile: {
        profileName: profile?.profile_name || "내 사주",
        relationship: normalizeRelationship(profile?.relationship, false),
        isSelf: normalizeRelationship(profile?.relationship, false) === "self",
        gender: normalizeGender(profile?.gender),
        calendarType: profile?.calendar_type || "양력",
        birthDate: profile?.birth_date || "",
        birthTime: profile?.birth_time || "",
        isLeapMonth: Boolean(profile?.is_leap_month),
        usesEarlyRatHour: false,
      },
      chart: data.chart_data,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const entry = validateEntry(await request.json());
    const profile = (entry.birthProfile || {}) as BirthProfile;
    if (!profile.birthDate) throw new Error("생년월일 정보가 없습니다.");
    const relationship = normalizeRelationship(profile.relationship, profile.isSelf);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });

    const profilePayload = {
      user_id: user.id,
      profile_name: profile.profileName || (relationship === "self" ? "내 사주" : "다른 사람"),
      relationship,
      gender: normalizeGender(profile.gender),
      calendar_type: normalizeCalendarType(profile.calendarType),
      birth_date: profile.birthDate,
      birth_time: profile.birthTime || null,
      birth_time_unknown: !profile.birthTime,
      is_leap_month: Boolean(profile.isLeapMonth),
      timezone: "Asia/Seoul",
      is_primary: relationship === "self",
    };

    let savedProfile: { id: string } | null = null;
    let profileError: { message?: string } | null = null;

    // 3단계에서 기존 대상자를 선택해 다시 계산할 때는 같은 행을 갱신합니다.
    if (typeof entry.birthProfileId === "string" && entry.birthProfileId) {
      const result = await supabase
        .from("birth_profiles")
        .update(profilePayload)
        .eq("id", entry.birthProfileId)
        .eq("user_id", user.id)
        .select("id")
        .single();

      savedProfile = result.data;
      profileError = result.error;
    } else if (relationship === "self") {
      // 본인 사주는 사용자당 하나만 유지하고 입력값이 바뀌면 기존 대표 행을 갱신합니다.
      const { data: existingPrimary, error: primaryLookupError } = await supabase
        .from("birth_profiles")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_primary", true)
        .limit(1);

      if (primaryLookupError) throw primaryLookupError;

      const primaryId = existingPrimary?.[0]?.id;

      if (primaryId) {
        const result = await supabase
          .from("birth_profiles")
          .update(profilePayload)
          .eq("id", primaryId)
          .eq("user_id", user.id)
          .select("id")
          .single();

        savedProfile = result.data;
        profileError = result.error;
      } else {
        const result = await supabase
          .from("birth_profiles")
          .upsert(profilePayload, {
            onConflict: "user_id,gender,calendar_type,birth_date,birth_time,birth_time_unknown,is_leap_month,timezone",
          })
          .select("id")
          .single();

        savedProfile = result.data;
        profileError = result.error;
      }
    } else {
      // 다른 사람은 출생정보가 다르면 별도의 프로필 행으로 저장됩니다.
      const result = await supabase
        .from("birth_profiles")
        .upsert(profilePayload, {
          onConflict: "user_id,gender,calendar_type,birth_date,birth_time,birth_time_unknown,is_leap_month,timezone",
        })
        .select("id")
        .single();

      savedProfile = result.data;
      profileError = result.error;
    }

    if (profileError) throw profileError;
    if (!savedProfile) throw new Error("사주 대상자 정보를 저장하지 못했습니다.");

    const { data: savedChart, error: chartError } = await supabase
      .from("saju_charts")
      .upsert({
        user_id: user.id,
        birth_profile_id: savedProfile.id,
        engine_version: String(entry.engineVersion || "manseryeok-v1"),
        calculated_at: entry.calculatedAt || new Date().toISOString(),
        chart_data: entry.chart,
      }, { onConflict: "birth_profile_id" })
      .select("id")
      .single();

    if (chartError) throw chartError;
    return Response.json({ success: true, birthProfileId: savedProfile.id, chartId: savedChart.id });
  } catch (reason: unknown) {
    console.error("POST /api/saju-charts 저장 오류:", reason);
  
    const error =
      reason && typeof reason === "object"
        ? (reason as Record<string, unknown>)
        : null;
  
    const message =
      reason instanceof Error
        ? reason.message
        : typeof error?.message === "string"
          ? error.message
          : typeof error?.details === "string"
            ? error.details
            : typeof reason === "string"
              ? reason
              : "만세력 저장 중 오류가 발생했습니다.";
  
    return Response.json(
      {
        success: false,
        error: message,
        code: error?.code ?? null,
        details: error?.details ?? null,
        hint: error?.hint ?? null,
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const birthProfileId = String(body?.birthProfileId ?? "").trim();

    if (!birthProfileId) {
      return Response.json(
        { success: false, error: "삭제할 사주 대상자를 선택해 주세요." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const { data: target, error: targetError } = await supabase
      .from("birth_profiles")
      .select("id, profile_name, relationship, is_primary")
      .eq("id", birthProfileId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!target) {
      return Response.json(
        { success: false, error: "삭제할 사주를 찾지 못했습니다." },
        { status: 404 },
      );
    }

    // 과거 데이터의 relationship 값이 잘못 저장된 경우가 있으므로
    // 삭제 보호 기준은 사용자당 한 명인 is_primary만 사용합니다.
    if (target.is_primary) {
      return Response.json(
        { success: false, error: "내 사주는 삭제할 수 없습니다. 출생정보를 수정해 주세요." },
        { status: 403 },
      );
    }

    // 사주 차트를 먼저 지우면 연결된 풀이와 특징 스냅샷은 FK CASCADE로 함께 삭제됩니다.
    const { error: chartDeleteError } = await supabase
      .from("saju_charts")
      .delete()
      .eq("birth_profile_id", birthProfileId)
      .eq("user_id", user.id);

    if (chartDeleteError) throw chartDeleteError;

    const { data: deletedProfile, error: profileDeleteError } = await supabase
      .from("birth_profiles")
      .delete()
      .eq("id", birthProfileId)
      .eq("user_id", user.id)
      .eq("is_primary", false)
      .select("id")
      .maybeSingle();

    if (profileDeleteError) throw profileDeleteError;
    if (!deletedProfile) {
      return Response.json(
        { success: false, error: "사주 대상자를 삭제하지 못했습니다." },
        { status: 409 },
      );
    }

    return Response.json({
      success: true,
      deletedBirthProfileId: deletedProfile.id,
      deletedProfileName: target.profile_name,
    });
  } catch (reason: unknown) {
    console.error("DELETE /api/saju-charts 삭제 오류:", reason);

    const error =
      reason && typeof reason === "object"
        ? (reason as Record<string, unknown>)
        : null;

    const message =
      reason instanceof Error
        ? reason.message
        : typeof error?.message === "string"
          ? error.message
          : "저장된 사주를 삭제하는 중 오류가 발생했습니다.";

    return Response.json(
      {
        success: false,
        error: message,
        code: error?.code ?? null,
        details: error?.details ?? null,
        hint: error?.hint ?? null,
      },
      { status: 500 },
    );
  }
}
