import Link from "next/link";

type ComingSoonExperienceProps = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  nextStep: string;
}>;

export default function ComingSoonExperience({
  eyebrow,
  title,
  description,
  nextStep,
}: ComingSoonExperienceProps) {
  return (
    <main className="grid min-h-[calc(100vh-74px)] place-items-center bg-[radial-gradient(circle_at_50%_0%,#e8f0ff_0%,#f6f8ff_42%,#f5f7ff_100%)] px-5 py-14">
      <section className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-[#d8e3f6] bg-white px-7 py-10 text-center shadow-[0_24px_70px_rgba(49,79,145,.12)] sm:px-12 sm:py-14">
        <span className="inline-flex rounded-full bg-[#e8f0ff] px-4 py-2 text-xs font-extrabold tracking-[-.02em] text-[#285bc5]">
          {eyebrow}
        </span>

        <div
          className="mx-auto mt-7 grid h-20 w-20 place-items-center rounded-[26px] bg-[linear-gradient(145deg,#edf4ff,#ece9ff)] text-4xl shadow-inner"
          aria-hidden="true"
        >
          ✦
        </div>

        <h1 className="mt-7 text-3xl font-black tracking-[-.05em] text-[#101f40] sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] font-medium leading-7 text-[#65738d] sm:text-base">
          {description}
        </p>

        <div className="mx-auto mt-8 rounded-2xl border border-[#dae5f8] bg-[#f6f9ff] px-5 py-4 text-sm font-bold leading-6 text-[#3f5683]">
          다음 작업: {nextStep}
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/home"
            className="rounded-xl border border-[#ccd9ee] bg-white px-5 py-3 font-bold text-[#40506c] transition hover:border-[#9fb7e8] hover:text-[#285bc5]"
          >
            홈으로 돌아가기
          </Link>
          <Link
            href="/fortune/manseryeok"
            className="rounded-xl bg-[#2e63df] px-5 py-3 font-bold text-white shadow-[0_9px_20px_rgba(46,99,223,.22)] transition hover:bg-[#2457c9]"
          >
            만세력 보기
          </Link>
        </div>
      </section>
    </main>
  );
}
