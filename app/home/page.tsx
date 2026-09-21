"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { SiteHeader } from "@/app/components/layout/site-header";



type IconProps = { className?: string };


function LogoIcon({ className = "h-6 w-6" }: IconProps) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="unse-logo-gradient"
            x1="8"
            y1="6"
            x2="40"
            y2="43"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#7C6CFF" />
            <stop offset="1" stopColor="#526FF2" />
          </linearGradient>
  
          <filter
            id="unse-logo-shadow"
            x="-30%"
            y="-30%"
            width="160%"
            height="170%"
          >
            <feDropShadow
              dx="0"
              dy="5"
              stdDeviation="4"
              floodColor="#6674F4"
              floodOpacity="0.3"
            />
          </filter>
        </defs>
  
        <circle
          cx="24"
          cy="22"
          r="19"
          fill="url(#unse-logo-gradient)"
          filter="url(#unse-logo-shadow)"
        />
  
        <path
          d="M24 10.5C24.8 16.2 27.8 19.2 33.5 20C27.8 20.8 24.8 23.8 24 29.5C23.2 23.8 20.2 20.8 14.5 20C20.2 19.2 23.2 16.2 24 10.5Z"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
  
        <path
          d="M13.5 27.5C17.5 25.7 21.7 26 25.7 28.2"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
  
        <circle cx="12.5" cy="28.2" r="2.1" fill="white" />
        <circle cx="33.8" cy="13.5" r="1.8" fill="white" />
      </svg>
    );
  }


function ArrowRightIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>;
}

function ShieldIcon({ className = "h-6 w-6" }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M12 3 4.5 6v5.7c0 4.7 3 7.8 7.5 9.3 4.5-1.5 7.5-4.6 7.5-9.3V6L12 3Z"/><path d="m9 12 2 2 4-4"/></svg>;
}

function CalendarIcon({ className = "h-12 w-12" }: IconProps) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><rect x="8" y="11" width="32" height="29" rx="5"/><path d="M16 7v8M32 7v8M8 20h32"/><path d="M16 27h3M25 27h3M16 34h3M25 34h3"/></svg>;
}

function ClipboardIcon({ className = "h-12 w-12" }: IconProps) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><rect x="10" y="10" width="28" height="33" rx="4"/><path d="M19 10V7h10v3M18 24h3M27 24h5M18 32h3M27 32h5"/><rect x="17" y="7" width="14" height="7" rx="3" fill="white"/></svg>;
}

function ChartIcon({ className = "h-12 w-12" }: IconProps) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M8 40h34M13 40V29h7v11M25 40V22h7v18M37 40V14h7v26M11 23c9-1 18-5 27-15"/><path d="M31 8h7v7"/></svg>;
}

function ChildIcon({ className = "h-12 w-12" }: IconProps) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><circle cx="24" cy="15" r="7"/><path d="M14 42v-7c0-7 4.5-12 10-12s10 5 10 12v7M16 29 8 35M32 29l8 6M20 42v-8M28 42v-8"/><path d="M21 15h.1M27 15h.1M21 19c1.8 1.5 4.2 1.5 6 0"/></svg>;
}

function HealthIcon({ className = "h-12 w-12" }: IconProps) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M40 11.8a10 10 0 0 0-14.2 0L24 13.6l-1.8-1.8A10 10 0 0 0 8 26l2 2 14 13 14-13 2-2a10 10 0 0 0 0-14.2Z"/><path d="M12 25h7l3-6 5 12 3-6h6"/></svg>;
}

function HeartIcon({ className = "h-12 w-12" }: IconProps) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M40 11.8a10 10 0 0 0-14.2 0L24 13.6l-1.8-1.8A10 10 0 0 0 8 26l2 2 14 13 14-13 2-2a10 10 0 0 0 0-14.2Z"/></svg>;
}

function PeopleIcon({ className = "h-12 w-12" }: IconProps) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><circle cx="17" cy="16" r="7"/><circle cx="34" cy="17" r="6"/><path d="M5 40v-3a12 12 0 0 1 24 0v3M29 27h3a10 10 0 0 1 10 10v3"/></svg>;
}

function DocumentIcon({ className = "h-12 w-12" }: IconProps) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M12 5h19l8 8v30H12z"/><path d="M31 5v9h8"/><text x="16" y="32" fill="currentColor" stroke="none" fontSize="12" fontWeight="800">2026</text></svg>;
}

function Bars({ side }: { side: "left" | "right" }) {
  const heights = side === "left" ? [26, 45, 64, 42] : [35, 29, 48, 65, 83];
  return <div className="absolute bottom-[105px] flex h-[86px] items-end gap-3 opacity-55" style={{ [side]: 38 }}><span className="absolute bottom-0 left-[-8px] h-px w-[112px] bg-[#d5e1f7]"/>{heights.map((h,i)=><span key={i} className="w-[9px] rounded-t bg-gradient-to-t from-[#e6efff] to-[#91c5ff]" style={{height:h}}/>)}</div>;
}

function Metric({ className, title, value, color }: { className: string; title: string; value: string; color: string }) {
  return <div className={`absolute z-20 w-[108px] rounded-[10px] border border-[#cddbf2] bg-white/90 p-3 shadow-[0_3px_10px_rgba(46,76,135,.07)] backdrop-blur ${className}`}><p className="text-[13px] font-medium text-[#526078]">{title}</p><p className="mt-1 text-[25px] font-extrabold leading-none" style={{color}}>{value}<span className="text-[17px]">%</span></p><div className="mt-3 h-[6px] overflow-hidden rounded-full bg-[#dde5f5]"><div className="h-full rounded-full" style={{width:value+"%",background:color}}/></div></div>;
}

function HeroIllustration() {
  return <div className="relative mx-auto h-[445px] w-full max-w-[570px] rounded-[30px] border border-white/90 bg-white/55 shadow-[0_18px_45px_rgba(75,105,160,.08)] backdrop-blur-sm">
    <Metric className="left-8 top-9" title="전반운" value="82" color="#2f6ee9" />
    <Metric className="right-7 top-11" title="재물운" value="78" color="#2f6ee9" />
    <Metric className="bottom-7 left-7" title="성장운" value="88" color="#7555e9" />
    <Metric className="bottom-3 right-8" title="연애운" value="75" color="#865ee9" />
    <Bars side="left"/><Bars side="right"/>
    <svg viewBox="0 0 360 360" className="absolute left-1/2 top-1/2 h-[310px] w-[310px] -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
      <defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#5a8fff"/><stop offset=".55" stopColor="#62b2ff"/><stop offset="1" stopColor="#9d66ee"/></linearGradient></defs>
      <circle cx="180" cy="180" r="132" fill="white" fillOpacity=".35" stroke="#a9c5fb" strokeWidth="1.5"/>
      <circle cx="180" cy="180" r="109" fill="none" stroke="#d8e4f8" strokeWidth="28"/>
      <circle cx="180" cy="180" r="109" fill="none" stroke="url(#ring)" strokeWidth="28" strokeDasharray="580 105" strokeLinecap="butt" transform="rotate(-90 180 180)"/>
      <path d="M68 180h224M180 48v24M180 288v24" stroke="#6390ed" strokeWidth="1.5"/>
      <path d="M86 181c28 0 37-62 70-62 32 0 41 59 73 59 31 0 41-67 69-67" fill="none" stroke="url(#ring)" strokeWidth="6" strokeLinecap="round"/>
      <path d="M89 228c25 0 36-30 65-30 31 0 48 54 81 54 26 0 39-31 65-31" fill="none" stroke="#d6e1f7" strokeWidth="6" strokeLinecap="round"/>
      <path d="M47 83h-28M19 83l-14-15M313 92h28M341 92l14-15M47 282h-28M19 282 5 297M313 281h28M341 281l14 15" stroke="#8fb9fb" strokeWidth="1.5" strokeDasharray="5 5"/>
      <circle cx="4" cy="66" r="4" fill="#78a8f5"/><circle cx="356" cy="76" r="4" fill="#78a8f5"/><circle cx="4" cy="298" r="4" fill="#78a8f5"/><circle cx="356" cy="298" r="4" fill="#78a8f5"/>
    </svg>
  </div>;
}

type ServiceItem = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  color: string;
  badge?: string;
  comingSoon?: boolean;
};
const services: ServiceItem[] = [
  { title:"오늘의 운세", description:"하루의 흐름을\n한눈에 확인하세요", href:"/fortune/today", icon:<CalendarIcon/>, color:"text-[#2873e6]" },
  
  {
    title: "사주 총평",
    description: "나의 성향과 운세 흐름을\n종합적으로 분석해드려요",
    href: "/fortune/saju",
    icon: <ClipboardIcon />,
    color: "text-[#183f9e]",
    badge: "추천"
  },
  
  { title:"재물운", description:"재물 흐름과 기회를\n미리 살펴보세요", href:"/fortune/wealth", icon:<ChartIcon/>, color:"text-[#2774dd]" },
  { title:"자녀운", description:"자녀와의 인연과 성장의\n흐름을 살펴보세요", href:"/fortune/children", icon:<ChildIcon/>, color:"text-[#4d77df]", badge:"준비중", comingSoon:true },
  { title:"건강운", description:"몸과 마음의 흐름을\n미리 살펴보세요", href:"/fortune/health", icon:<HealthIcon/>, color:"text-[#28a17b]", badge:"준비중", comingSoon:true },
  { title:"연애운", description:"연애 흐름과 인연의\n타이밍을 알려드려요", href:"/fortune/love", icon:<HeartIcon/>, color:"text-[#8a63dc]" },
  { title:"궁합", description:"두 사람의 조화와\n궁합을 확인해보세요", href:"/fortune/compatibility", icon:<PeopleIcon/>, color:"text-[#3177db]" },
  { title:"2026 토정비결", description:"다가오는 한 해의 흐름을\n미리 준비하세요", href:"/fortune/tojeong", icon:<DocumentIcon/>, color:"text-[#2873df]" },
];
export default function HomePage() {
  return <div className="min-h-screen bg-white text-[#071536]">
    <SiteHeader />

    <main>
      <section className="relative overflow-hidden bg-[#f7f9ff]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_67%_40%,rgba(204,222,255,.7),transparent_36%),radial-gradient(circle_at_95%_5%,rgba(227,215,255,.65),transparent_32%)]"/>
        <div className="absolute -bottom-40 left-[26%] h-[390px] w-[390px] rounded-full bg-[#e9efff]/80"/>
        <div className="absolute -bottom-28 right-[-4%] h-[350px] w-[350px] rounded-full bg-[#e3ecff]/70"/>
        <div className="relative mx-auto grid min-h-[520px] max-w-[1400px] items-center gap-12 px-6 py-12 lg:grid-cols-[1.04fr_.96fr] lg:px-10 lg:py-12">
          <div className="lg:pl-4">
            <h1 className="text-[42px] font-extrabold leading-[1.34] tracking-[-.055em] text-[#07183e] sm:text-[54px]">내 삶의 흐름을<br/>이해하는 가장 쉬운 방법</h1>
            <p className="mt-7 text-[18px] font-medium text-[#536078] sm:text-[20px]">복잡한 사주를 쉽고 따뜻하게 풀어드려요</p>
            <Link href="/saju/input" className="mt-11 inline-flex h-[70px] items-center gap-5 rounded-[15px] bg-[#2862e3] px-10 text-[21px] font-bold text-white shadow-[0_11px_22px_rgba(38,98,227,.25)] transition hover:-translate-y-0.5 hover:bg-[#2158d5]">무료로 사주 보기<ArrowRightIcon className="h-6 w-6"/></Link>
            <p className="mt-5 flex items-center gap-3 text-[16px] font-medium text-[#58657d]"><ShieldIcon className="h-7 w-7 text-[#2264e9]"/>가입 없이 바로 확인</p>
          </div>
          <HeroIllustration/>
        </div>
      </section>

      <section id="services" className="bg-white px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="text-[27px] font-extrabold tracking-[-.035em]">가장 많이 찾는 운세</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const cardClassName = `group relative flex min-h-[248px] flex-col items-center justify-center rounded-[14px] border bg-white px-4 py-6 text-center transition ${service.comingSoon ? "cursor-not-allowed border-[#d8e0ed] bg-[#fbfcfe]" : service.badge ? "border-[#2862e3] shadow-[0_8px_23px_rgba(47,91,193,.09)] hover:-translate-y-1 hover:shadow-lg" : "border-[#d8e0ed] hover:-translate-y-1 hover:shadow-lg"}`;
              const cardContent = (
                <>
                  {service.badge && (
                    <span className={`absolute right-3 top-3 rounded px-2.5 py-1 text-xs font-bold ${service.comingSoon ? "bg-[#eef1f6] text-[#778295]" : "bg-[#2862e3] text-white"}`}>
                      {service.badge}
                    </span>
                  )}
                  <span className={service.comingSoon ? "text-[#9aa8bc]" : service.color}>{service.icon}</span>
                  <h3 className={`mt-5 text-[21px] font-extrabold tracking-[-.035em] ${service.comingSoon ? "text-[#667085]" : ""}`}>{service.title}</h3>
                  <p className="mt-3 whitespace-pre-line text-[14px] leading-6 text-[#536078]">{service.description}</p>
                </>
              );

              if (service.comingSoon) {
                return (
                  <div key={service.title} className={cardClassName} aria-disabled="true" title={`${service.title} (준비중)`}>
                    {cardContent}
                  </div>
                );
              }

              return (
                <Link href={service.href} key={service.title} className={cardClassName}>
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  </div>;
}
