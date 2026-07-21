import { Sparkles } from "lucide-react"

export function SiteHeader({ onLogin }) {
  return (
    <header className="border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-2 text-lg font-black tracking-tight">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
          <span>운세인사이트</span>
        </div>
        <button
          type="button"
          onClick={onLogin}
          className="rounded-full border border-primary/25 px-5 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
        >
          간편 로그인
        </button>
      </div>
    </header>
  )
}
