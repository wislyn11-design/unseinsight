import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;

  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/home";

  // 외부 사이트로 강제 이동하는 것을 방지합니다.
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/home";
  }

  // Vercel 같은 프록시 환경에서도 실제 서비스 주소로 이동하도록 처리합니다.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ?? "https";

  const redirectOrigin =
    process.env.NODE_ENV === "development" || !forwardedHost
      ? origin
      : `${forwardedProto}://${forwardedHost}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }

    const errorUrl = new URL(next, redirectOrigin);
    errorUrl.searchParams.set("login_error", "code_exchange_failed");
    return NextResponse.redirect(errorUrl);
  }

  const errorUrl = new URL(next, redirectOrigin);
  errorUrl.searchParams.set(
    "login_error",
    searchParams.get("error_code") ??
      searchParams.get("error") ??
      "missing_code"
  );

  return NextResponse.redirect(errorUrl);
}
