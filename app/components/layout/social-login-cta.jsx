import { ArrowRight } from "lucide-react"

export function SocialLoginCta({ onLogin }) {
  return (
    <section className="mx-auto max-w-lg px-5 pb-10">
      <p className="text-center text-sm leading-relaxed text-muted-foreground">매번 입력하기 번거로우신가요?</p>
      <p className="mt-1 text-center text-base font-bold leading-relaxed text-foreground sm:text-lg">
        3초 만에 로그인하고 내 사주를 평생 무료로 저장하세요!
      </p>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={onLogin}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary underline decoration-primary/40 decoration-2 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
        >
          간편 로그인창 열기
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
