import { cookies } from "next/headers";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

// 임시 진단: 쿠키 값, 토큰, 사용자 ID, 이름, 이메일, 키는 반환하지 않습니다.
export async function GET() {
  const cookieStore = await cookies();
  const authCookies = cookieStore.getAll().filter(({ name }) =>
    /^sb-.+-auth-token(?:\.\d+)?$/.test(name),
  );
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let expectedCookieName = "";
  try {
    if (supabaseUrl) expectedCookieName = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
  } catch { /* 잘못된 URL 자체를 출력하지 않습니다. */ }
  const status = {
    hasAuthCookie: authCookies.some(({ value }) => Boolean(value)),
    hasCurrentProjectCookie: Boolean(expectedCookieName) && authCookies.some(({ name, value }) =>
      Boolean(value) && (name === expectedCookieName || name.startsWith(`${expectedCookieName}.`)),
    ),
    supabaseUrlConfigured: Boolean(supabaseUrl),
    publicKeyConfigured: Boolean(publicKey),
  };
  const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie" };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    // 예상치 못한 오류 문자열이나 개인정보가 노출되지 않도록 분류 결과만 표시합니다.
    const message = String(error?.message || "").toLowerCase();
    const reason = !error ? "none"
      : /session missing|auth session missing/.test(message) ? "session_missing"
      : /future|not yet valid|issued at/.test(message) ? "token_time_error"
      : /expired/.test(message) ? "token_expired"
      : /invalid.*(jwt|token)|(jwt|token).*invalid/.test(message) ? "token_invalid"
      : /fetch|network|timeout/.test(message) ? "auth_network_error"
      : "auth_validation_failed";
    return Response.json({
      ...status,
      authenticated: Boolean(data?.user) && !error,
      reason,
      authErrorStatus: typeof error?.status === "number" ? error.status : null,
    }, { headers });
  } catch {
    return Response.json({ ...status, authenticated: false, reason: "server_check_failed", authErrorStatus: null }, { headers });
  }
}
