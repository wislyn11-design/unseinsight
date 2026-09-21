"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FortunePageIntro from "@/app/components/fortune/page-intro/FortunePageIntro";
import styles from "./SajuOverviewSection.module.css";

export const sampleServices = [
  { id:1, group:"나의 본질", icon:"✦", title:"한눈에 보는 나의 사주", short:"사주 전체의 핵심과 삶의 방향을 한 번에 살펴봐요.", eyebrow:"나를 설명하는 한 문장", headline:"차분함 속에 단단한 추진력을 품은, 시간이 갈수록 빛나는 사람입니다.", paragraphs:[{title:"사주의 중심",body:"겉으로는 신중하고 부드러워 보이지만, 마음속에는 스스로 세운 기준과 끝까지 해내려는 힘이 자리합니다."},{title:"삶의 방향",body:"경험이 쌓일수록 판단과 표현이 안정되는 후반 성장형에 가깝습니다. 쌓아 온 지식과 관계가 앞으로 더 큰 자산으로 이어집니다."}], tip:"속도보다 방향을 믿어보세요. 오래 쌓아 온 것이 결국 가장 큰 힘이 됩니다." },
  { id:2, group:"나의 본질", icon:"◐", title:"타고난 성격과 기질", short:"겉으로 보이는 모습과 내면의 진짜 성향을 알아봐요.", eyebrow:"겉과 속의 조화", headline:"섬세하게 살피고 신중하게 결정하며, 마음을 주면 오래 지키는 편입니다.", paragraphs:[{title:"겉으로 보이는 나",body:"낯선 환경에서는 먼저 분위기를 읽고 생각을 정리합니다. 필요한 순간에는 정확한 의견을 내는 사람입니다."},{title:"내면의 성향",body:"감정과 생각의 깊이가 있어 혼자 정리하는 시간이 필요합니다. 감정을 조금씩 표현하는 연습이 도움이 됩니다."}], tip:"결론뿐 아니라 그 결론에 도달한 과정도 가까운 사람에게 들려주세요." },
  { id:3, group:"나의 본질", icon:"◆", title:"나의 강점과 숨은 가능성", short:"타고난 장점과 아직 발견하지 못한 잠재력을 찾아봐요.", eyebrow:"오래 갈수록 강해지는 힘", headline:"꾸준함과 현실 감각, 사람의 마음을 읽는 섬세함이 가장 큰 자산입니다.", paragraphs:[{title:"이미 가진 강점",body:"복잡한 상황에서도 중요한 것을 구분하고 순서를 잡는 능력이 있습니다."},{title:"숨은 가능성",body:"경험을 말과 글로 정리해 다른 사람에게 전달할 때 영향력이 더 크게 발달합니다."}], tip:"잘하는 일을 혼자 완성하는 데 그치지 말고, 설명하고 나누는 단계까지 넓혀보세요." },
  { id:4, group:"균형과 관계", icon:"△", title:"주의해야 할 성향", short:"반복하기 쉬운 어려움과 균형이 필요한 부분을 살펴봐요.", eyebrow:"조금 덜어내면 편안해지는 것", headline:"책임감이 지나치면 모든 짐을 혼자 지려는 모습으로 나타날 수 있습니다.", paragraphs:[{title:"반복하기 쉬운 패턴",body:"완벽하게 준비할 때까지 시작을 미루거나 다른 사람의 몫까지 떠안을 수 있습니다."},{title:"균형을 찾는 방법",body:"지금 가능한 첫 단계를 선택하고, 역할과 책임의 경계를 분명히 하는 것이 좋습니다."}], tip:"오늘 해야 할 일 중 ‘내가 아니어도 되는 일’ 하나를 내려놓아 보세요." },
  { id:5, group:"균형과 관계", icon:"◎", title:"인간관계 방식", short:"사람과 가까워지고 신뢰를 쌓는 나만의 방식을 알아봐요.", eyebrow:"천천히, 그러나 깊게", headline:"많은 사람과 넓게 지내기보다 마음이 맞는 사람과 오래 신뢰를 쌓습니다.", paragraphs:[{title:"관계의 시작",body:"상대의 말과 행동을 충분히 살핀 뒤 마음을 열고, 신뢰가 생기면 약속을 중요하게 여깁니다."},{title:"갈등이 생겼을 때",body:"생각을 정리할 시간이 필요하다는 말을 먼저 전하면 관계가 한결 편안해집니다."}], tip:"마음을 알아주길 기다리기보다 작은 말로 먼저 표현해 보세요." },
  { id:6, group:"균형과 관계", icon:"五", title:"오행으로 보는 에너지 균형", short:"목·화·토·금·수의 조화와 생활 속 보완법을 확인해요.", eyebrow:"나를 움직이는 다섯 가지 기운", headline:"안정과 현실을 만드는 힘이 중심을 잡고, 표현과 확장이 균형을 더해줍니다.", paragraphs:[{title:"강하게 나타나는 기운",body:"토의 기운은 책임감과 현실 감각, 계획을 실제 결과로 만드는 힘으로 이어집니다."},{title:"생활 속 보완",body:"가벼운 산책과 새로운 배움, 밝은 공간에서의 대화가 표현과 확장을 도와줍니다."}], tip:"오행은 좋고 나쁨의 점수가 아니라, 나의 에너지를 이해하는 지도입니다." },
  { id:7, group:"일·돈·사랑", icon:"▣", title:"일과 직업 성향", short:"능력이 잘 발휘되는 일의 방식과 환경을 찾아봐요.", eyebrow:"나답게 성과를 만드는 방식", headline:"기준이 분명하고 축적이 중요한 환경에서 전문성과 책임감이 빛납니다.", paragraphs:[{title:"일하는 방식",body:"목표와 역할이 분명할 때 집중력이 높고, 경험과 신뢰가 쌓이는 일을 잘합니다."},{title:"잘 맞는 환경",body:"자율성을 주되 결과 기준이 명확하고, 충분히 준비한 뒤 실행할 수 있는 환경이 잘 맞습니다."}], tip:"직업 이름보다 어떤 방식으로 일할 때 힘이 나는지를 먼저 살펴보세요." },
  { id:8, group:"일·돈·사랑", icon:"₩", title:"돈을 대하는 기본 성향", short:"수입·소비·저축에서 나타나는 기본 습관을 살펴봐요.", eyebrow:"안정을 바탕으로 기회를 만드는 재물관", headline:"확실한 기반을 지키면서, 이해한 분야의 기회를 천천히 넓히는 방식이 어울립니다.", paragraphs:[{title:"돈을 버는 방식",body:"실력과 신뢰를 쌓아 수입을 키우는 안정적인 방식이 중심입니다."},{title:"관리할 때의 주의점",body:"목적별로 돈의 경계를 나누고 기회성 지출에는 미리 정한 기준을 적용하는 것이 좋습니다."}], tip:"자세한 시기별 수입과 지출 흐름은 재물운에서 이어서 보여주세요." },
  { id:9, group:"일·돈·사랑", icon:"♡", title:"사랑과 연애의 기본 성향", short:"호감을 느끼고 사랑을 표현하는 나만의 방식을 알아봐요.", eyebrow:"말보다 행동으로 깊어지는 사랑", headline:"쉽게 마음을 열지는 않지만, 믿음을 주고받으면 오래 곁을 지키는 사람입니다.", paragraphs:[{title:"사랑의 표현",body:"화려한 표현보다 상대의 필요를 기억하고 실제로 챙기는 방식으로 마음을 전합니다."},{title:"관계에서 필요한 것",body:"서운함을 오래 참다가 한꺼번에 꺼내지 않도록 작은 감정을 그때그때 알려주는 것이 중요합니다."}], tip:"상대가 알아주기를 기다리기보다 원하는 것을 부드럽고 구체적으로 말해보세요." },
  { id:10, group:"현재의 흐름과 조언", icon:"↗", title:"지금까지 이어진 성장 흐름", short:"지금의 나를 만든 성장 주제와 전환을 살펴봐요.", eyebrow:"시간이 나의 편이 되는 흐름", headline:"초반의 경험이 중년 이후 힘 있게 연결되는, 축적형 성장 리듬을 가졌습니다.", paragraphs:[{title:"지나온 흐름",body:"시행착오를 거치며 현실을 보는 눈과 쉽게 흔들리지 않는 내면의 힘이 만들어졌습니다."},{title:"현재로 이어진 힘",body:"쌓은 경험을 선택적으로 활용하면서 삶의 주도권이 커집니다."}], tip:"지나온 경험이 지금 어떤 힘으로 이어졌는지 살펴보세요." },
  { id:11, group:"현재의 흐름과 조언", icon:"◷", title:"현재 내가 지나고 있는 시기", short:"지금 대운의 핵심 주제와 준비해야 할 일을 확인해요.", eyebrow:"지금 10년의 핵심 주제", headline:"지금은 흩어진 경험을 하나의 방향으로 모으고, 내 이름의 기반을 만드는 시기입니다.", paragraphs:[{title:"현재의 기회",body:"오랫동안 생각해 온 일을 구체적인 형태로 만들기에 좋은 흐름입니다."},{title:"주의할 선택",body:"가장 오래 이어갈 한 가지를 중심에 두고 나머지는 그 목표를 돕는 방식으로 정리해 보세요."}], tip:"더 많이 시작하기보다 이미 시작한 것의 완성도를 높이는 데 힘을 모아보세요." },
  { id:12, group:"현재의 흐름과 조언", icon:"☼", title:"나를 위한 실천 조언", short:"사주 흐름을 오늘의 작은 행동으로 연결해봐요.", eyebrow:"오늘부터 시작하는 세 가지", headline:"내가 가진 힘을 믿되, 혼자 버티지 않고 세상과 나누는 연습이 필요합니다.", paragraphs:[{title:"더 살려야 할 것",body:"꾸준함과 현실 감각, 사람을 세심하게 살피는 힘은 이미 충분한 자산입니다."},{title:"조금 내려놓을 것",body:"완벽하게 준비해야 시작할 수 있다는 생각과 모든 기대를 만족시켜야 한다는 부담은 내려놓아도 좋습니다."}], tip:"미뤄 둔 일 하나를 20분만 시작하고, 믿는 사람 한 명에게 계획을 이야기해 보세요." },
];

const groupCopy = {"나의 본질":"타고난 나를 이해해요","균형과 관계":"나와 사람 사이를 살펴봐요","일·돈·사랑":"삶의 중요한 선택 기준을 찾아요","현재의 흐름과 조언":"지금의 흐름을 삶의 선택으로 연결해요"};

const overviewSections = [
  { key: "essence", label: "나의 본질", ids: [1, 2, 3] },
  { key: "balance", label: "균형과 관계", ids: [4, 5, 6] },
  { key: "workMoneyLove", label: "일·돈·사랑", ids: [7, 8, 9] },
  { key: "flow", label: "현재의 흐름과 조언", ids: [10, 11, 12] },
];

function koreanBirthTime(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  const padded = digits.padStart(4, "0").slice(-4);
  return `${Number(padded.slice(0, 2))}시 ${padded.slice(2)}분`;
}

function getChartId(entry) {
  return String(entry?.chartId || entry?.chart_id || entry?.id || "").trim();
}

function buildIntroProfile(entry) {
  if (!entry || typeof entry !== "object") return null;

  const chartEnvelope = entry.chartData || entry.chart_data || {};
  const localChart = entry.chart || chartEnvelope.chart || entry;
  const profile =
    entry.profile ||
    entry.birthProfile ||
    chartEnvelope.birthProfile ||
    localChart?.birthProfile ||
    {};

  const name =
    profile.profileName ||
    profile.profile_name ||
    localChart?.profileName ||
    localChart?.profile_name ||
    "";
  const birthDate =
    profile.birthDate ||
    profile.birth_date ||
    localChart?.birthDate ||
    localChart?.birth_date ||
    localChart?.solarDate ||
    "";

  if (!birthDate) return null;

  const birthTime =
    profile.birthTime ||
    profile.birth_time ||
    localChart?.birthTime ||
    localChart?.birth_time ||
    "";
  const birthTimeUnknown = Boolean(
    profile.birthTimeUnknown ??
      profile.birth_time_unknown ??
      localChart?.birthTimeUnknown ??
      localChart?.birth_time_unknown ??
      false,
  );
  const calendarType =
    profile.calendarType ||
    profile.calendar_type ||
    localChart?.calendarType ||
    localChart?.calendar_type ||
    "solar";
  const isLeapMonth = Boolean(
    profile.isLeapMonth ??
      profile.is_leap_month ??
      localChart?.isLeapMonth ??
      localChart?.is_leap_month ??
      false,
  );

  return {
    name: name || "사용자",
    birthDate,
    birthTime: birthTimeUnknown ? "" : koreanBirthTime(birthTime),
    birthTimeUnknown,
    calendarType,
    isLeapMonth,
  };
}

const LIFE_MAP_DECADES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function calculateCurrentAge(birthDate) {
  const match = String(birthDate || "").match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (!match) return null;

  const today = new Date();
  const birthYear = Number(match[1]);
  const birthMonth = Number(match[2]);
  const birthDay = Number(match[3]);
  let age = today.getFullYear() - birthYear;
  if (
    today.getMonth() + 1 < birthMonth ||
    (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay)
  ) {
    age -= 1;
  }
  return Number.isFinite(age) && age >= 0 ? age : null;
}

function decadeForAge(age) {
  if (!Number.isFinite(age)) return 10;
  if (age >= 100) return 100;
  return Math.max(10, Math.floor(age / 10) * 10);
}

function periodOverlapsDecade(period, decade) {
  if (!Number.isFinite(period?.startAge) || !Number.isFinite(period?.endAge)) {
    return false;
  }
  const rangeEnd = decade === 100 ? Number.POSITIVE_INFINITY : decade + 9;
  return period.startAge <= rangeEnd && period.endAge >= decade;
}

function daeunLabel(period) {
  if (!period) return "확인 중";
  const ageRange =
    Number.isFinite(period.startAge) && Number.isFinite(period.endAge)
      ? `${period.startAge}~${period.endAge}세`
      : `${period.index || "-"}번째 대운`;
  return period.ganji ? `${ageRange} · ${period.ganji}` : ageRange;
}

function mergeEssenceServices(baseServices, essence) {
  const essenceById = new Map(
    (Array.isArray(essence) ? essence : []).map((item) => [Number(item.id), item]),
  );

  return baseServices.map((service) => {
    const generated = essenceById.get(service.id);
    if (!generated) return service;

    return {
      ...service,
      eyebrow: generated.eyebrow,
      headline: generated.headline,
      keywords: generated.keywords,
      paragraphs: generated.paragraphs,
      tip: generated.tip,
      loading: false,
      error: false,
      loadingMessage: "",
    };
  });
}

function buildSectionStatusServices(
  baseServices,
  section,
  message,
  failed = false,
) {
  const targetIds = new Set(section.ids);
  return baseServices.map((service) => {
    if (!targetIds.has(service.id)) return service;

    return {
      ...service,
      eyebrow: failed ? "풀이를 불러오지 못했습니다" : "원국과 대운 분석 중",
      headline: failed
        ? `${section.label}에 대한 사주풀이를 불러오지 못했습니다.`
        : `만세력을 바탕으로 ${section.label}을 깊이 있게 살펴보고 있습니다.`,
      keywords: [],
      paragraphs: [
        {
          title: failed
            ? "다시 확인해 주세요"
            : `${section.label}을 살펴보고 있습니다`,
          body: message,
        },
      ],
      tip: failed
        ? "잠시 후 페이지를 새로고침해 다시 확인해 주세요."
        : "원국과 대운을 충분히 살펴본 뒤 상세한 사주풀이를 보여드립니다.",
      loading: !failed,
      error: failed,
      loadingMessage: message,
    };
  });
}

function Chevron({ open = false }) {
  return <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} aria-hidden="true" />;
}

function DetailContent({ service }) {
  if (service.loading) {
    return <div className={styles.loadingState} role="status" aria-live="polite">
      <span className={styles.loadingSpinner} aria-hidden="true" />
      <b>사주총평을 분석하고 있습니다</b>
      <p>{service.loadingMessage || "사주 원국과 전체 대운을 꼼꼼히 살펴보고 있습니다."}</p>
      <small>잠시만 기다려 주세요.</small>
    </div>;
  }

  return <div className={styles.detailContent}>
    <div className={styles.detailTopline}><span>{String(service.id).padStart(2, "0")}</span><small>{service.group}</small></div>
    <p className={styles.eyebrow}>{service.eyebrow}</p>
    <h2>{service.headline}</h2>
    {Array.isArray(service.keywords) && service.keywords.length > 0 && <div className={styles.keyTags}>{service.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>}
    <div className={styles.detailSections}>{service.paragraphs.map((item) => <section key={item.title}><h3>{item.title}</h3><p>{item.body}</p></section>)}</div>
    <div className={styles.tip}><span>✦</span><div><b>나를 위한 인사이트</b><p>{service.tip}</p></div></div>
  </div>;
}

function SajuLifeMap({ stories, daeunPeriods, currentAge, loading, error }) {
  const currentDecade = decadeForAge(currentAge);
  const [selectedDecade, setSelectedDecade] = useState(currentDecade);

  useEffect(() => {
    setSelectedDecade(currentDecade);
  }, [currentDecade]);

  const selectedStory = (Array.isArray(stories) ? stories : []).find(
    (story) => Number(story?.id) === selectedDecade,
  );
  const periods = Array.isArray(daeunPeriods) ? daeunPeriods : [];
  const currentPeriod = Number.isFinite(currentAge)
    ? periods.find(
        (period) =>
          Number.isFinite(period?.startAge) &&
          Number.isFinite(period?.endAge) &&
          currentAge >= period.startAge &&
          currentAge <= period.endAge,
      )
    : null;
  const selectedPeriods = periods.filter((period) =>
    periodOverlapsDecade(period, selectedDecade),
  );
  const nextTransitionAge = Number.isFinite(currentPeriod?.endAge)
    ? currentPeriod.endAge + 1
    : null;

  return <section className={styles.lifeMap} aria-labelledby="saju-life-map-title">
    <div className={styles.lifeMapHeading}>
      <div>
        <small>사주총평의 시작</small>
        <h2 id="saju-life-map-title">나의 인생 지도</h2>
        <p>10대부터 100세까지, 연령별 삶의 주제와 실제 대운의 흐름을 함께 살펴보세요.</p>
      </div>
      <span className={styles.lifeMapMark}>⌁</span>
    </div>

    {loading && <div className={styles.lifeMapLoading} role="status" aria-live="polite">
      <span className={styles.loadingSpinner} aria-hidden="true" />
      <b>인생의 큰 흐름을 분석하고 있습니다</b>
      <p>원국과 전체 대운을 연결해 10대부터 100세까지 차근차근 살펴보고 있습니다.</p>
      <small>잠시만 기다려 주세요.</small>
    </div>}

    {!loading && error && <div className={styles.lifeMapError} role="alert">
      <b>나의 인생 지도를 불러오지 못했습니다</b>
      <p>{error}</p>
      <small>잠시 후 페이지를 새로고침해 다시 확인해 주세요.</small>
    </div>}

    {!loading && !error && selectedStory && <>
      <div className={styles.lifeMapSummary}>
        <div><small>현재 나이</small><b>{Number.isFinite(currentAge) ? `${currentAge}세` : "확인 중"}</b></div>
        <div><small>현재 대운</small><b>{daeunLabel(currentPeriod)}</b></div>
        <div><small>다음 전환</small><b>{nextTransitionAge ? `${nextTransitionAge}세` : "대운 정보 확인 중"}</b></div>
      </div>

      <div className={styles.decadeNavigation} aria-label="연령대 선택">
        {LIFE_MAP_DECADES.map((decade) => <button
          type="button"
          key={decade}
          className={`${styles.decadeButton} ${selectedDecade === decade ? styles.decadeButtonActive : ""} ${currentDecade === decade ? styles.decadeButtonCurrent : ""}`}
          onClick={() => setSelectedDecade(decade)}
          aria-pressed={selectedDecade === decade}
        >
          <b>{decade === 100 ? "100세+" : `${decade}대`}</b>
          <small>{decade === 100 ? "100세 이후" : `${decade}~${decade + 9}세`}</small>
        </button>)}
      </div>

      <article className={styles.lifeMapStory}>
        <aside className={styles.lifeMapAge}>
          <small>선택한 시기</small>
          <strong>{selectedDecade === 100 ? "100+" : `${selectedDecade}대`}</strong>
          <span>{selectedStory.eyebrow}</span>
        </aside>
        <div className={styles.lifeMapCopy}>
          <small>{selectedStory.eyebrow}</small>
          <h3>{selectedStory.headline}</h3>
          {Array.isArray(selectedStory.keywords) && selectedStory.keywords.length > 0 && <div className={styles.lifeMapTags}>{selectedStory.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>}
          <div className={styles.lifeMapParagraphs}>{selectedStory.paragraphs.map((paragraph) => <section key={paragraph.title}><h4>{paragraph.title}</h4><p>{paragraph.body}</p></section>)}</div>

          <div className={styles.lifeMapDaeun}>
            <div><b>이 연령대와 연결되는 대운</b><small>DB 만세력의 실제 시작 나이를 기준으로 표시합니다.</small></div>
            {selectedPeriods.length > 0
              ? <div>{selectedPeriods.map((period) => <span key={period.factId}><b>{daeunLabel(period)}</b>{Number.isFinite(period.startYear) && Number.isFinite(period.endYear) ? <small>{period.startYear}~{period.endYear}년</small> : null}</span>)}</div>
              : <p>저장된 대운에서 정확한 시작 나이를 확인하고 있습니다.</p>}
          </div>

          <div className={styles.lifeMapInsight}><span>✦</span><div><b>이 시기를 위한 인사이트</b><p>{selectedStory.tip}</p></div></div>
        </div>
      </article>
    </>}
  </section>;
}

export default function SajuOverviewSection({
  profile: providedProfile = null,
  services = sampleServices,
  summary: providedSummary = null,
  essence: providedEssence = null,
}) {
  const [activeId, setActiveId] = useState(1);
  const [readIds, setReadIds] = useState([1]);
  const [introProfile, setIntroProfile] = useState(providedProfile);
  const [chartId, setChartId] = useState("");
  const [overviewSummary, setOverviewSummary] = useState(providedSummary);
  const [overviewServices, setOverviewServices] = useState(() =>
    providedEssence
      ? mergeEssenceServices(services, providedEssence)
      : buildSectionStatusServices(
          services,
          overviewSections[0],
          "사주 원국과 전체 대운을 바탕으로 사주총평을 분석하고 있습니다.",
        ),
  );
  const [summaryLoading, setSummaryLoading] = useState(!providedSummary);
  const [summaryError, setSummaryError] = useState("");
  const [lifeMapStories, setLifeMapStories] = useState([]);
  const [lifeMapDaeunPeriods, setLifeMapDaeunPeriods] = useState([]);
  const [lifeMapLoading, setLifeMapLoading] = useState(true);
  const [lifeMapError, setLifeMapError] = useState("");
  const accordionCardRefs = useRef(new Map());
  const pendingScrollIdRef = useRef(null);
  const groups = useMemo(() => Array.from(new Set(overviewServices.map((item) => item.group))), [overviewServices]);
  const currentAge = useMemo(
    () => calculateCurrentAge(introProfile?.birthDate),
    [introProfile?.birthDate],
  );

  useEffect(() => {
    const targetId = pendingScrollIdRef.current;
    if (!targetId || activeId !== targetId) return undefined;

    // 이전 아코디언이 닫히고 선택한 아코디언이 열린 뒤의 위치를 기준으로 이동합니다.
    const frameId = window.requestAnimationFrame(() => {
      const targetCard = accordionCardRefs.current.get(targetId);
      if (!targetCard) return;

      targetCard.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
      pendingScrollIdRef.current = null;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeId]);

  useEffect(() => {
    if (providedProfile) setIntroProfile(providedProfile);

    const controller = new AbortController();

    async function loadProfileAndChartId() {
      let activeEntry = null;
      const storedSaju = sessionStorage.getItem("unseinsight:lastSaju");

      if (storedSaju) {
        try {
          activeEntry = JSON.parse(storedSaju);
        } catch {
          sessionStorage.removeItem("unseinsight:lastSaju");
        }
      }

      const cachedProfile = buildIntroProfile(activeEntry);
      const cachedChartId = getChartId(activeEntry);

      if (!providedProfile && cachedProfile) {
        setIntroProfile(cachedProfile);
      }
      if (cachedChartId) setChartId(cachedChartId);

      // chartId만 있고 프로필이 없는 오래된 세션도 DB에서 즉시 보완합니다.
      if (!cachedChartId || (!providedProfile && !cachedProfile)) {
        const chartResponse = await fetch("/api/saju-charts", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        const chartData = await chartResponse.json().catch(() => null);

        if (
          !chartResponse.ok ||
          !chartData?.success ||
          !getChartId(chartData?.entry)
        ) {
          throw new Error(
            chartResponse.status === 401
              ? "로그인 후 사주총평을 확인해 주세요."
              : "DB에 저장된 만세력 정보가 없습니다. 만세력을 먼저 계산해 주세요.",
          );
        }

        activeEntry = chartData.entry;
        sessionStorage.setItem(
          "unseinsight:lastSaju",
          JSON.stringify(activeEntry),
        );
        setChartId(getChartId(activeEntry));

        if (!providedProfile) {
          setIntroProfile(buildIntroProfile(activeEntry));
        }
      }
    }

    void loadProfileAndChartId().catch((reason) => {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      if (!providedProfile) setIntroProfile(null);
      if (!providedSummary) {
        setSummaryError(
          reason instanceof Error
            ? reason.message
            : "저장된 만세력 정보를 불러오지 못했습니다.",
        );
        setSummaryLoading(false);
      }
      setLifeMapError(
        reason instanceof Error
          ? reason.message
          : "저장된 만세력 정보를 불러오지 못했습니다.",
      );
      setLifeMapLoading(false);
    });

    return () => controller.abort();
  }, [providedProfile, providedSummary]);

  useEffect(() => {
    const providedIds = new Set(
      (Array.isArray(providedEssence) ? providedEssence : []).map((item) =>
        Number(item?.id),
      ),
    );

    if (providedEssence) {
      setOverviewSummary(providedSummary);
      setOverviewServices((previous) =>
        mergeEssenceServices(previous, providedEssence),
      );
      if (providedSummary) setSummaryLoading(false);
    }
    if (!chartId) return undefined;

    const controller = new AbortController();
    const sectionsToLoad = overviewSections.filter(
      (section) =>
        (section.key === "essence" && !providedSummary) ||
        section.ids.some((id) => !providedIds.has(id)),
    );

    async function loadOverviewSection(section) {
      if (section.key === "essence") {
        setSummaryLoading(true);
        setSummaryError("");
      }
      setOverviewServices((previous) =>
        buildSectionStatusServices(
          previous,
          section,
          `사주 원국과 전체 대운을 바탕으로 ${section.label} 풀이를 작성하고 있습니다.`,
        ),
      );

      try {
        const overviewResponse = await fetch("/api/fortune/overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chartId, section: section.key }),
          signal: controller.signal,
        });
        const overviewData = await overviewResponse.json().catch(() => null);

        if (!overviewResponse.ok || !overviewData?.success) {
          throw new Error(
            overviewData?.error || `${section.label} 풀이를 불러오지 못했습니다.`,
          );
        }

        const generatedStories = Array.isArray(overviewData.stories)
          ? overviewData.stories
          : overviewData.essence;
        if (
          !Array.isArray(generatedStories) ||
          !section.ids.every((id) =>
            generatedStories.some((item) => Number(item?.id) === id),
          )
        ) {
          throw new Error(`${section.label} 풀이 결과가 누락되었습니다.`);
        }

        if (section.key === "essence") {
          setOverviewSummary(overviewData.summary);
        }
        setOverviewServices((previous) =>
          mergeEssenceServices(previous, generatedStories),
        );
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        const message =
          reason instanceof Error
            ? reason.message
            : `${section.label} 풀이를 불러오지 못했습니다.`;
        if (section.key === "essence") {
          setOverviewSummary(null);
          setSummaryError(message);
        }
        setOverviewServices((previous) =>
          buildSectionStatusServices(previous, section, message, true),
        );
      } finally {
        if (!controller.signal.aborted && section.key === "essence") {
          setSummaryLoading(false);
        }
      }
    }

    void Promise.allSettled(
      sectionsToLoad.map((section) => loadOverviewSection(section)),
    );

    return () => controller.abort();
  }, [chartId, providedEssence, providedSummary, services]);

  useEffect(() => {
    if (!chartId) return undefined;

    const controller = new AbortController();
    setLifeMapLoading(true);
    setLifeMapError("");

    async function loadLifeMap() {
      try {
        const response = await fetch("/api/fortune/overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chartId, section: "lifeMap" }),
          signal: controller.signal,
        });
        const data = await response.json().catch(() => null);
        const timeline = Array.isArray(data?.timeline)
          ? data.timeline
          : data?.stories;

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "나의 인생 지도를 불러오지 못했습니다.");
        }
        if (
          !Array.isArray(timeline) ||
          !LIFE_MAP_DECADES.every((decade) =>
            timeline.some((item) => Number(item?.id) === decade),
          )
        ) {
          throw new Error("나의 인생 지도 결과가 일부 누락되었습니다.");
        }

        setLifeMapStories(timeline);
        setLifeMapDaeunPeriods(
          Array.isArray(data?.daeunPeriods) ? data.daeunPeriods : [],
        );
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setLifeMapStories([]);
        setLifeMapDaeunPeriods([]);
        setLifeMapError(
          reason instanceof Error
            ? reason.message
            : "나의 인생 지도를 불러오지 못했습니다.",
        );
      } finally {
        if (!controller.signal.aborted) setLifeMapLoading(false);
      }
    }

    void loadLifeMap();
    return () => controller.abort();
  }, [chartId]);

  const displaySummary = overviewSummary || {
    element: summaryLoading ? "…" : "!",
    sentence: summaryLoading
      ? "만세력의 원국과 대운을 바탕으로 사주총평을 풀이하고 있습니다."
      : summaryError || "사주총평 대표 풀이를 불러오지 못했습니다.",
    keywords: [],
  };

  const openService = (id) => {
    setActiveId(id);
    setReadIds((previous) => previous.includes(id) ? previous : [...previous, id]);
  };

  const toggleService = (id) => {
    if (activeId === id) {
      pendingScrollIdRef.current = null;
      setActiveId(null);
      return;
    }
    pendingScrollIdRef.current = id;
    openService(id);
  };

  return <section className={styles.overview}>
    <FortunePageIntro
      serviceTitle="사주총평"
      description="타고난 나부터 지금의 흐름까지, 12가지 이야기로 차근차근 알아보세요."
      profile={introProfile}
    />

    <div className={styles.summaryWrap}>
      <div className={styles.summaryCard}>
        <div className={styles.summarySymbol}>{summaryLoading ? <span className={styles.summaryLoadingSpinner} aria-label="분석 중" /> : <span>{displaySummary.element}</span>}<small>중심 기운</small></div>
        <div className={styles.summaryCopy}><small>나를 대표하는 한 문장</small><strong>“{displaySummary.sentence}”</strong><div>{displaySummary.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div></div>
        <div className={styles.progress}><div><span>읽은 이야기</span><b>{readIds.length}<small> / {overviewServices.length}</small></b></div><div className={styles.track}><i style={{ width: `${readIds.length / overviewServices.length * 100}%` }} /></div><small>천천히, 나의 속도로 살펴보세요</small></div>
      </div>
    </div>

    <SajuLifeMap
      stories={lifeMapStories}
      daeunPeriods={lifeMapDaeunPeriods}
      currentAge={currentAge}
      loading={lifeMapLoading}
      error={lifeMapError}
    />

    <div className={styles.accordionExperience}>
      <div className={styles.accordionHeading}>
        <div><small>전체 이야기</small><b>12가지 사주 인사이트</b></div>
        <span>{readIds.length}개 읽음</span>
      </div>

      {groups.map((group, groupIndex) => <section className={styles.accordionGroup} key={group}>
        <div className={styles.groupTitle}><span>{groupIndex + 1}</span><div><b>{group}</b><small>{groupCopy[group]}</small></div></div>
        {overviewServices.filter((item) => item.group === group).map((service) => {
          const open = activeId === service.id;
          return <article
            className={`${styles.accordionCard} ${open ? styles.accordionCardOpen : ""}`}
            key={service.id}
            ref={(node) => {
              if (node) accordionCardRefs.current.set(service.id, node);
              else accordionCardRefs.current.delete(service.id);
            }}
            style={{ scrollMarginTop: "112px" }}
          >
            <button className={styles.accordionToggle} onClick={() => toggleService(service.id)} aria-expanded={open}>
              <span className={styles.serviceIcon}>{service.icon}</span>
              <span className={styles.accordionLabel}><small>{String(service.id).padStart(2, "0")} · {service.group}</small><b>{service.title}</b><em>{service.short}</em></span>
              {readIds.includes(service.id) && !open ? <span className={styles.readCheck}>✓</span> : <Chevron open={open} />}
            </button>
            {open && <div className={styles.accordionBody} aria-live="polite">
              <DetailContent service={service} />
            </div>}
          </article>;
        })}
      </section>)}
    </div>
  </section>;
}
