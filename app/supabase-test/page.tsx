export const dynamic = "force-dynamic";

export default async function SupabaseTestPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  let connected = false;
  let message = "";

  if (!supabaseUrl || !publishableKey) {
    message = ".env.local의 Supabase 환경변수를 확인해주세요.";
  } else {
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: {
          apikey: publishableKey,
        },
        cache: "no-store",
      });

      connected = response.ok;
      message = response.ok
        ? "Supabase 연결에 성공했습니다."
        : `Supabase 응답 오류: ${response.status}`;
    } catch {
      message = "Supabase 서버에 연결할 수 없습니다.";
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f7ff",
      }}
    >
      <section
        style={{
          width: "90%",
          maxWidth: "480px",
          padding: "40px",
          textAlign: "center",
          backgroundColor: "white",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(58, 91, 191, 0.12)",
        }}
      >
        <h1 style={{ color: "#3a5bbf" }}>
          Supabase 연결 테스트
        </h1>

        <p
          style={{
            marginTop: "20px",
            color: connected ? "#16803c" : "#c62828",
            fontWeight: 700,
          }}
        >
          {message}
        </p>
      </section>
    </main>
  );
}