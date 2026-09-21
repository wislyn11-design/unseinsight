/**
 * 운세인사이트 신살 계산 정책 v1
 *
 * 원칙
 * 1. 출전이 확인되는 고전 규칙을 우선한다.
 * 2. 서로 다른 조견표를 한 신살에 섞지 않는다.
 * 3. 지지만 보는 규칙과 간지 전체를 보는 규칙을 구분한다.
 * 4. 원국과 운(대운·세운·월운·일진)을 별도 함수로 계산한다.
 * 5. 신살은 보조 지표이며 단독으로 사건을 단정하지 않는다.
 *
 * 주요 출전
 * - 『삼명통회』 권3: 천을·태극·학당/사관·양인/비인·금여 등
 * - 『삼명통회』 권5~6: 천복·천주·복성귀인
 * - 『오행정기』 권13: 문창귀·복성귀인 계열 조견
 * - 『연해자평』: 고란살
 *
 * 주의
 * - 원진살(元辰)은 성별과 연간 음양이 필요한 고전식으로만 계산한다.
 *   options.gender가 없으면 추측하지 않고 원진살을 생략한다.
 * - 고전식 학당 정위는 납음까지 필요하므로 이 파일에서는 억지로
 *   단순화하지 않는다. 대신 관성의 장생/임관을 보는 관귀학당과
 *   관귀사관을 명확히 분리한다.
 */

export const SINSAL_POLICY_VERSION = 'sinsal-v1.1.0';

export const SINSAL_POLICY = Object.freeze({
  version: SINSAL_POLICY_VERSION,
  principles: Object.freeze([
    '고전 문헌 우선',
    '학설 혼합 금지',
    '근거 공개',
    '버전 관리',
    '원국과 운 분리',
  ]),
  notes: Object.freeze({
    wonjin: '성별과 연간 음양을 사용하는 元辰 고전식',
    twelveSinsal: '연지와 일지를 각각 기준으로 계산하고 근거를 보존',
    hakdang: '납음이 필요한 학당 정위는 이 모듈의 단순 조견에서 제외',
  }),
});

export const SINSAL_SOURCES = Object.freeze({
  samyeongTonghoeOverview: 'https://ctext.org/wiki.pl?if=gb&res=758991',
  cheoneul: 'https://zh.wikisource.org/wiki/三命通會_(四庫全書本)/全覽',
  taegeukAndMunchang: 'https://www.shidianguji.com/zh/book/SK1610/chapter/1ktkuwj016kui',
  hakdangAndSagwan: 'https://zh.wikisource.org/wiki/三命通會_(四庫全書本)/全覽',
  yanginAndBiin: 'https://www.shidianguji.com/zh/book/SK1610/chapter/1kutiho2qupsj',
  cheonju: 'https://zh.wikisource.org/zh-hant/三命通會_(四庫全書本)/全覽',
  cheonbok: 'https://zh.wikisource.org/zh-hant/三命通會_(四庫全書本)/全覽',
  bokseong: 'https://www.quanxue.cn/qt_mingxiang/sanmingth/sanmingth53.html',
  hyeonchim: 'https://www.shidianguji.com/zh/book/SK1610/chapter/1kf5v6v49uof9',
  goran: 'https://ctext.org/wiki.pl?chapter=117077&if=gb',
  wonjin: 'https://ctext.org/wiki.pl?chapter=117077&if=en&remap=gb',
});

const CHEONGAN = Object.freeze([
  '갑', '을', '병', '정', '무', '기', '경', '신', '임', '계',
]);

const JIJI = Object.freeze([
  '자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해',
]);

const PILLAR_KEYS = Object.freeze(['year', 'month', 'day', 'hour']);

/*
 * 실제 60갑자만 허용한다. 천간·지지를 각각 따로 검증하면 병사(丙巳)처럼
 * 음양이 맞지 않아 존재하지 않는 기둥도 통과하므로 반드시 간지 전체를
 * 이 집합과 대조해야 한다.
 */
const SIXTY_GANJI = Object.freeze(
  Array.from({ length: 60 }, (_, index) =>
    `${CHEONGAN[index % CHEONGAN.length]}${JIJI[index % JIJI.length]}`
  )
);
const SIXTY_GANJI_SET = new Set(SIXTY_GANJI);

const TWELVE_SINSAL_MAPS = Object.freeze({
  겁살: Object.freeze({ 자: '사', 축: '인', 인: '해', 묘: '신', 진: '사', 사: '인', 오: '해', 미: '신', 신: '사', 유: '인', 술: '해', 해: '신' }),
  재살: Object.freeze({ 자: '오', 축: '묘', 인: '자', 묘: '유', 진: '오', 사: '묘', 오: '자', 미: '유', 신: '오', 유: '묘', 술: '자', 해: '유' }),
  천살: Object.freeze({ 자: '미', 축: '진', 인: '축', 묘: '술', 진: '미', 사: '진', 오: '축', 미: '술', 신: '미', 유: '진', 술: '축', 해: '술' }),
  지살: Object.freeze({ 자: '신', 축: '사', 인: '인', 묘: '해', 진: '신', 사: '사', 오: '인', 미: '해', 신: '신', 유: '사', 술: '인', 해: '해' }),
  년살: Object.freeze({ 자: '유', 축: '오', 인: '묘', 묘: '자', 진: '유', 사: '오', 오: '묘', 미: '자', 신: '유', 유: '오', 술: '묘', 해: '자' }),
  월살: Object.freeze({ 자: '술', 축: '미', 인: '진', 묘: '축', 진: '술', 사: '미', 오: '진', 미: '축', 신: '술', 유: '미', 술: '진', 해: '축' }),
  망신살: Object.freeze({ 자: '해', 축: '신', 인: '사', 묘: '인', 진: '해', 사: '신', 오: '사', 미: '인', 신: '해', 유: '신', 술: '사', 해: '인' }),
  장성살: Object.freeze({ 자: '자', 축: '유', 인: '오', 묘: '묘', 진: '자', 사: '유', 오: '오', 미: '묘', 신: '자', 유: '유', 술: '오', 해: '묘' }),
  반안살: Object.freeze({ 자: '축', 축: '술', 인: '미', 묘: '진', 진: '축', 사: '술', 오: '미', 미: '진', 신: '축', 유: '술', 술: '미', 해: '진' }),
  역마살: Object.freeze({ 자: '인', 축: '해', 인: '신', 묘: '사', 진: '인', 사: '해', 오: '신', 미: '사', 신: '인', 유: '해', 술: '신', 해: '사' }),
  육해살: Object.freeze({ 자: '묘', 축: '자', 인: '유', 묘: '오', 진: '묘', 사: '자', 오: '유', 미: '오', 신: '묘', 유: '자', 술: '유', 해: '오' }),
  화개살: Object.freeze({ 자: '진', 축: '축', 인: '술', 묘: '미', 진: '진', 사: '축', 오: '술', 미: '미', 신: '진', 유: '축', 술: '술', 해: '미' }),
});

const TWELVE_SINSAL_NAMES = Object.freeze(Object.keys(TWELVE_SINSAL_MAPS));

const JI_CHUNG_MAP = Object.freeze({
  자: '오', 축: '미', 인: '신', 묘: '유', 진: '술', 사: '해',
  오: '자', 미: '축', 신: '인', 유: '묘', 술: '진', 해: '사',
});

/*
 * 『삼명통회』 권6 자평식 양인: 甲·丙·戊·庚·壬 다섯 양간만 적용한다.
 * 음간까지 확장하는 별도 학설은 이 정책에 섞지 않는다.
 * 비인(飛刃)은 채택한 양인의 대충지이다.
 */
const YANGIN_MAP = Object.freeze({
  갑: '묘', 병: '오', 무: '오', 경: '유', 임: '자',
});

const BIIN_MAP = Object.freeze(
  Object.fromEntries(
    Object.entries(YANGIN_MAP).map(([gan, ji]) => [gan, JI_CHUNG_MAP[ji]])
  )
);

/* 일간을 기준으로 지지를 찾는 규칙. */
const DAY_GAN_JI_RULES = Object.freeze({
  천을귀인: Object.freeze({
    갑: '축미', 을: '자신', 병: '해유', 정: '해유', 무: '축미',
    기: '자신', 경: '축미', 신: '인오', 임: '묘사', 계: '묘사',
  }),
  암록: Object.freeze({
    갑: '해', 을: '술', 병: '신', 정: '미', 무: '신',
    기: '미', 경: '사', 신: '진', 임: '인', 계: '축',
  }),
  금여: Object.freeze({
    갑: '진', 을: '사', 병: '미', 정: '신', 무: '미',
    기: '신', 경: '술', 신: '해', 임: '축', 계: '인',
  }),
  건록: Object.freeze({
    갑: '인', 을: '묘', 병: '사', 정: '오', 무: '사',
    기: '오', 경: '신', 신: '유', 임: '해', 계: '자',
  }),
  /* 『삼명통회』 천복귀인: 일간의 정관이 건록하는 지지. */
  천복귀인: Object.freeze({
    갑: '유', 을: '신', 병: '자', 정: '해', 무: '묘',
    기: '인', 경: '오', 신: '사', 임: '오', 계: '사',
  }),
  /* 『삼명통회』: 甲乙午, 丙寅, 丁未, 戊子, 己辰, 庚戌, 辛酉, 壬巳, 癸申. */
  홍염살: Object.freeze({
    갑: '오', 을: '오', 병: '인', 정: '미', 무: '자',
    기: '진', 경: '술', 신: '유', 임: '사', 계: '신',
  }),
  양인살: YANGIN_MAP,
  비인살: BIIN_MAP,
  /* 관성 오행의 장생지. */
  관귀학당: Object.freeze({
    갑: '사', 을: '사', 병: '신', 정: '신', 무: '해',
    기: '해', 경: '인', 신: '인', 임: '신', 계: '신',
  }),
  /* 관성 오행의 임관지. 임·계의 관성인 토는 임관이 해이다. */
  관귀사관: Object.freeze({
    갑: '신', 을: '신', 병: '해', 정: '해', 무: '인',
    기: '인', 경: '사', 신: '사', 임: '해', 계: '해',
  }),
});

/* 『삼명통회』의 태극귀는 연간을 기준으로 한다. */
const TAEGEUK_BY_YEAR_GAN = Object.freeze({
  갑: '자오', 을: '자오', 병: '묘유', 정: '묘유',
  무: '진술축미', 기: '진술축미', 경: '인해', 신: '인해',
  임: '사신', 계: '사신',
});

/* 『삼명통회』·『오행정기』의 문창귀. 통행 문창성 표와 혼용하지 않는다. */
const MUNCHANG_BY_YEAR_GAN = Object.freeze({
  갑: '사', 을: '해', 병: '술', 정: '진', 무: '신',
  기: '오', 경: '인', 신: '미', 임: '묘', 계: '축',
});

/*
 * 『삼명통회』 천주록: 식신 천간과 그 식신의 건록 지지가 원국 전체에
 * 모두 보여야 한다. 두 글자가 같은 기둥일 필요는 없다.
 */
const CHEONJU_COMPONENTS_BY_DAY_GAN = Object.freeze({
  갑: Object.freeze({ gan: '병', ji: '사' }),
  을: Object.freeze({ gan: '정', ji: '오' }),
  병: Object.freeze({ gan: '무', ji: '사' }),
  정: Object.freeze({ gan: '기', ji: '오' }),
  무: Object.freeze({ gan: '경', ji: '신' }),
  기: Object.freeze({ gan: '신', ji: '유' }),
  경: Object.freeze({ gan: '임', ji: '해' }),
  신: Object.freeze({ gan: '계', ji: '자' }),
  임: Object.freeze({ gan: '갑', ji: '인' }),
  계: Object.freeze({ gan: '을', ji: '묘' }),
});

/*
 * 『삼명통회』 복성귀인. “이시년론(以年論)”에 따라 연간을 기준으로
 * 하며 상대 기둥의 천간과 지지를 모두 확인한다.
 */
const BOKSEONG_GANJI_BY_YEAR_GAN = Object.freeze({
  갑: Object.freeze(['병인', '병자']),
  을: Object.freeze(['정해', '정축']),
  병: Object.freeze(['무자', '무술']),
  정: Object.freeze(['기유']),
  무: Object.freeze(['경신']),
  기: Object.freeze(['신미']),
  경: Object.freeze(['임오']),
  신: Object.freeze(['계사']),
  임: Object.freeze(['갑진']),
  계: Object.freeze(['을묘']),
});

const CHUNDEOK_MAP = Object.freeze({
  인: Object.freeze({ type: 'gan', value: '정' }),
  묘: Object.freeze({ type: 'ji', value: '신' }),
  진: Object.freeze({ type: 'gan', value: '임' }),
  사: Object.freeze({ type: 'gan', value: '신' }),
  오: Object.freeze({ type: 'ji', value: '해' }),
  미: Object.freeze({ type: 'gan', value: '갑' }),
  신: Object.freeze({ type: 'gan', value: '계' }),
  유: Object.freeze({ type: 'ji', value: '인' }),
  술: Object.freeze({ type: 'gan', value: '병' }),
  해: Object.freeze({ type: 'gan', value: '을' }),
  자: Object.freeze({ type: 'ji', value: '사' }),
  축: Object.freeze({ type: 'gan', value: '경' }),
});

const WOLDEOK_MAP = Object.freeze({
  인: '병', 묘: '갑', 진: '임', 사: '경', 오: '병', 미: '갑',
  신: '임', 유: '경', 술: '병', 해: '갑', 자: '임', 축: '경',
});

const BAEKHO_JU_LIST = Object.freeze([
  '갑진', '을미', '병술', '정축', '무진', '임술', '계축',
]);

/* 『삼명통회』·『연해자평』에 열거된 8개 일주. */
const GORAN_JU_LIST = Object.freeze([
  '갑인', '을사', '정사', '무신', '신해', '병오', '무오', '임자',
]);

const GWIMUN_PAIRS = Object.freeze([
  Object.freeze(['자', '유']), Object.freeze(['축', '오']),
  Object.freeze(['인', '미']), Object.freeze(['묘', '신']),
  Object.freeze(['진', '해']), Object.freeze(['사', '술']),
]);

/*
 * 元辰 고전식. 정적인 상호 쌍 6개로 축약하지 않는다.
 * 양남·음녀는 충의 앞자리, 음남·양녀는 충의 뒷자리를 사용한다.
 */
const WONJIN_YANG_MALE_YIN_FEMALE = Object.freeze({
  자: '미', 축: '신', 인: '유', 묘: '술', 진: '해', 사: '자',
  오: '축', 미: '인', 신: '묘', 유: '진', 술: '사', 해: '오',
});

const WONJIN_YIN_MALE_YANG_FEMALE = Object.freeze({
  자: '사', 축: '오', 인: '미', 묘: '신', 진: '유', 사: '술',
  오: '해', 미: '자', 신: '축', 유: '인', 술: '묘', 해: '진',
});

const YANG_GANS = Object.freeze(['갑', '병', '무', '경', '임']);

const NON_TWELVE_ORDER = Object.freeze([
  '천을귀인', '태극귀인', '암록', '금여', '건록', '문창귀인',
  '천주귀인', '천복귀인', '복성귀인', '관귀학당', '관귀사관',
  '천덕귀인', '월덕귀인', '홍염살', '양인살', '비인살',
  '백호살', '고란살', '귀문관살', '원진살', '현침살',
]);

function normalizeGender(gender) {
  const value = String(gender || '').trim().toLowerCase();
  if (['male', 'm', '남', '남자', '남성'].includes(value)) return 'male';
  if (['female', 'f', '여', '여자', '여성'].includes(value)) return 'female';
  return null;
}

function buildPillars(yearGan, yearJi, monthGan, monthJi, dayGan, dayJi, hourGan, hourJi) {
  return {
    year: { gan: yearGan, ji: yearJi },
    month: { gan: monthGan, ji: monthJi },
    day: { gan: dayGan, ji: dayJi },
    hour: { gan: hourGan, ji: hourJi },
  };
}

function ganjiOf(pillar) {
  return `${pillar?.gan || ''}${pillar?.ji || ''}`;
}

function isValidGanji(gan, ji) {
  return SIXTY_GANJI_SET.has(`${gan || ''}${ji || ''}`);
}

function expectedMonthGan(yearGan, monthJi) {
  const startByYearGan = {
    갑: '병', 기: '병', 을: '무', 경: '무', 병: '경', 신: '경',
    정: '임', 임: '임', 무: '갑', 계: '갑',
  };
  const monthOrder = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'];
  const startGan = startByYearGan[yearGan];
  const offset = monthOrder.indexOf(monthJi);
  if (!startGan || offset < 0) return null;
  return CHEONGAN[(CHEONGAN.indexOf(startGan) + offset) % CHEONGAN.length];
}

function expectedHourGan(dayGan, hourJi) {
  const startByDayGan = {
    갑: '갑', 기: '갑', 을: '병', 경: '병', 병: '무', 신: '무',
    정: '경', 임: '경', 무: '임', 계: '임',
  };
  const startGan = startByDayGan[dayGan];
  const offset = JIJI.indexOf(hourJi);
  if (!startGan || offset < 0) return null;
  return CHEONGAN[(CHEONGAN.indexOf(startGan) + offset) % CHEONGAN.length];
}

function validateNatalPillars(pillars) {
  const errors = [];
  ['year', 'month', 'day'].forEach((key) => {
    const pillar = pillars[key];
    if (!isValidGanji(pillar.gan, pillar.ji)) {
      errors.push(`${key} 기둥 ${ganjiOf(pillar) || '(없음)'}은 실제 60갑자가 아닙니다.`);
    }
  });

  const hourHasGan = CHEONGAN.includes(pillars.hour.gan);
  const hourHasJi = JIJI.includes(pillars.hour.ji);
  if (hourHasGan !== hourHasJi) {
    errors.push('hour 기둥은 천간과 지지를 함께 전달하거나 둘 다 생략해야 합니다.');
  } else if (hourHasGan && !isValidGanji(pillars.hour.gan, pillars.hour.ji)) {
    errors.push(`hour 기둥 ${ganjiOf(pillars.hour)}은 실제 60갑자가 아닙니다.`);
  }

  const monthGan = expectedMonthGan(pillars.year.gan, pillars.month.ji);
  if (monthGan && pillars.month.gan !== monthGan) {
    errors.push(
      `연간 ${pillars.year.gan}·월지 ${pillars.month.ji}의 월간은 ${monthGan}이어야 합니다.`
    );
  }

  if (hourHasGan) {
    const hourGan = expectedHourGan(pillars.day.gan, pillars.hour.ji);
    if (hourGan && pillars.hour.gan !== hourGan) {
      errors.push(
        `일간 ${pillars.day.gan}·시지 ${pillars.hour.ji}의 시간은 ${hourGan}이어야 합니다.`
      );
    }
  }

  return errors;
}

function ruleRank(name) {
  const twelveIndex = TWELVE_SINSAL_NAMES.indexOf(name);
  if (twelveIndex !== -1) return twelveIndex;
  const otherIndex = NON_TWELVE_ORDER.indexOf(name);
  return TWELVE_SINSAL_NAMES.length + (otherIndex === -1 ? 999 : otherIndex);
}

function sortItems(items) {
  return [...items].sort((a, b) => ruleRank(a.name) - ruleRank(b.name));
}

function resolveWonjinTarget(yearGan, yearJi, gender) {
  const normalizedGender = normalizeGender(gender);
  if (!normalizedGender || !CHEONGAN.includes(yearGan) || !JIJI.includes(yearJi)) {
    return null;
  }

  const yangYear = YANG_GANS.includes(yearGan);
  const firstDirection =
    (yangYear && normalizedGender === 'male') ||
    (!yangYear && normalizedGender === 'female');

  const map = firstDirection
    ? WONJIN_YANG_MALE_YIN_FEMALE
    : WONJIN_YIN_MALE_YANG_FEMALE;

  return map[yearJi] || null;
}

/**
 * 근거를 보존하는 원국 신살 상세 계산.
 * options.gender: 'male' | 'female' (원진살 계산에 필요)
 */
export function getSinsalDetailed(
  yearGan, yearJi, monthGan, monthJi, dayGan, dayJi, hourGan, hourJi,
  options = {}
) {
  const pillars = buildPillars(
    yearGan, yearJi, monthGan, monthJi, dayGan, dayJi, hourGan, hourJi
  );

  const result = { year: [], month: [], day: [], hour: [] };
  const validationErrors = validateNatalPillars(pillars);
  if (validationErrors.length) {
    return {
      version: SINSAL_POLICY_VERSION,
      pillars: result,
      warnings: validationErrors,
    };
  }

  function add(key, name, basis, source, ruleId) {
    if (!PILLAR_KEYS.includes(key)) return;
    const duplicate = result[key].some(
      (item) => item.name === name && item.basis === basis && item.source === source
    );
    if (!duplicate) result[key].push({ name, basis, source, ruleId });
  }

  function addToJi(targetJi, name, basis, source, ruleId) {
    if (!targetJi) return;
    PILLAR_KEYS.forEach((key) => {
      if (pillars[key].ji === targetJi) add(key, name, basis, source, ruleId);
    });
  }

  function addToGan(targetGan, name, basis, source, ruleId) {
    if (!targetGan) return;
    PILLAR_KEYS.forEach((key) => {
      if (pillars[key].gan === targetGan) add(key, name, basis, source, ruleId);
    });
  }

  function addToGanji(targetGanji, name, basis, source, ruleId) {
    if (!targetGanji) return;
    PILLAR_KEYS.forEach((key) => {
      if (ganjiOf(pillars[key]) === targetGanji) add(key, name, basis, source, ruleId);
    });
  }

  /* 12신살: 연지와 일지를 따로 계산해 출처를 잃지 않는다. */
  [
    { ji: yearJi, source: 'yearJi', label: '원국 연지' },
    { ji: dayJi, source: 'dayJi', label: '원국 일지' },
  ].filter((base) => JIJI.includes(base.ji)).forEach((base) => {
    Object.entries(TWELVE_SINSAL_MAPS).forEach(([name, map]) => {
      const targetJi = map[base.ji];
      addToJi(
        targetJi,
        name,
        `${base.label} ${base.ji} 기준 → ${targetJi}`,
        base.source,
        `twelve.${name}`
      );
    });
  });

  /* 일간 기준 지지 조견. */
  Object.entries(DAY_GAN_JI_RULES).forEach(([name, map]) => {
    const targetJis = map[dayGan] || '';
    [...targetJis].forEach((targetJi) => {
      addToJi(
        targetJi,
        name,
        `원국 일간 ${dayGan} 기준 → 지지 ${targetJi}`,
        'dayGan',
        `dayGanJi.${name}`
      );
    });
  });

  /* 연간 기준 태극귀인과 문창귀인. */
  [
    ['태극귀인', TAEGEUK_BY_YEAR_GAN, 'yearGanJi.taegeuk'],
    ['문창귀인', MUNCHANG_BY_YEAR_GAN, 'yearGanJi.munchang'],
  ].forEach(([name, map, ruleId]) => {
    [...(map[yearGan] || '')].forEach((targetJi) => {
      addToJi(
        targetJi,
        name,
        `원국 연간 ${yearGan} 기준 → 지지 ${targetJi}`,
        'yearGan',
        ruleId
      );
    });
  });

  /*
   * 천주록은 식신 천간과 그 건록 지지가 원국 전체에 모두 보이면 성립한다.
   * 같은 기둥의 가상 간지(예: 丙巳)를 요구하지 않으며, 조건을 실제로
   * 구성한 모든 기둥에 근거를 표시한다.
   */
  const cheonju = CHEONJU_COMPONENTS_BY_DAY_GAN[dayGan];
  if (cheonju) {
    const ganKeys = PILLAR_KEYS.filter((key) => pillars[key].gan === cheonju.gan);
    const jiKeys = PILLAR_KEYS.filter((key) => pillars[key].ji === cheonju.ji);
    if (ganKeys.length && jiKeys.length) {
      [...new Set([...ganKeys, ...jiKeys])].forEach((key) => {
        add(
          key,
          '천주귀인',
          `원국 일간 ${dayGan}: 식신 천간 ${cheonju.gan}과 건록 지지 ${cheonju.ji}가 원국 전체에 모두 존재`,
          'dayGan+natalGan+natalJi',
          'components.cheonju'
        );
      });
    }
  }

  (BOKSEONG_GANJI_BY_YEAR_GAN[yearGan] || []).forEach((targetGanji) => {
    addToGanji(
      targetGanji,
      '복성귀인',
      `원국 연간 ${yearGan} 기준 진식신 간지 ${targetGanji}`,
      'yearGan+pillarGanji',
      'ganji.bokseong'
    );
  });

  const chundeok = CHUNDEOK_MAP[monthJi];
  if (chundeok?.type === 'gan') {
    addToGan(
      chundeok.value, '천덕귀인',
      `원국 월지 ${monthJi} 기준 → 천간 ${chundeok.value}`,
      'monthJi', 'monthJi.chundeok'
    );
  } else if (chundeok?.type === 'ji') {
    addToJi(
      chundeok.value, '천덕귀인',
      `원국 월지 ${monthJi} 기준 → 지지 ${chundeok.value}`,
      'monthJi', 'monthJi.chundeok'
    );
  }

  const woldeokGan = WOLDEOK_MAP[monthJi];
  if (woldeokGan) {
    addToGan(
      woldeokGan, '월덕귀인',
      `원국 월지 ${monthJi} 기준 → 천간 ${woldeokGan}`,
      'monthJi', 'monthJi.woldeok'
    );
  }

  const dayGanji = `${dayGan || ''}${dayJi || ''}`;
  if (BAEKHO_JU_LIST.includes(dayGanji)) {
    add('day', '백호살', `원국 일주 ${dayGanji}`, 'dayPillar', 'dayPillar.baekho');
  }
  if (GORAN_JU_LIST.includes(dayGanji)) {
    add('day', '고란살', `원국 일주 ${dayGanji}`, 'dayPillar', 'dayPillar.goran');
  }

  /* 귀문관살은 원국 안에서 실제로 쌍이 함께 있을 때만 양쪽에 표시한다. */
  GWIMUN_PAIRS.forEach(([a, b]) => {
    const hasA = PILLAR_KEYS.some((key) => pillars[key].ji === a);
    const hasB = PILLAR_KEYS.some((key) => pillars[key].ji === b);
    if (!hasA || !hasB) return;
    PILLAR_KEYS.forEach((key) => {
      if ([a, b].includes(pillars[key].ji)) {
        add(
          key, '귀문관살', `원국 지지 ${a}-${b} 쌍`,
          'natalJiPair', `pair.gwimun.${a}${b}`
        );
      }
    });
  });

  /* 원진살은 성별을 받았을 때만 고전 元辰 방식으로 계산한다. */
  const wonjinTarget = resolveWonjinTarget(yearGan, yearJi, options.gender);
  if (wonjinTarget) {
    addToJi(
      wonjinTarget,
      '원진살',
      `연간 ${yearGan}의 음양·성별 ${normalizeGender(options.gender)}·연지 ${yearJi} 기준 → ${wonjinTarget}`,
      'yearGan+yearJi+gender',
      'wonjin.wonjin'
    );
  }

  /* 현침: 甲·辛 및 卯·午·申. 未는 포함하지 않는다. */
  PILLAR_KEYS.forEach((key) => {
    if (['갑', '신'].includes(pillars[key].gan)) {
      add(key, '현침살', `천간 ${pillars[key].gan}`, 'pillarGan', 'character.hyeonchim');
    }
    if (['묘', '오', '신'].includes(pillars[key].ji)) {
      add(key, '현침살', `지지 ${pillars[key].ji}`, 'pillarJi', 'character.hyeonchim');
    }
  });

  PILLAR_KEYS.forEach((key) => {
    result[key] = sortItems(result[key]);
  });

  return {
    version: SINSAL_POLICY_VERSION,
    pillars: result,
    warnings: normalizeGender(options.gender)
      ? []
      : ['성별이 없어 고전식 원진살(元辰)은 계산하지 않았습니다.'],
  };
}

/**
 * 기존 화면과의 호환 함수.
 * 반환값은 이전처럼 { year: string[], month: string[], day: string[], hour: string[] }이다.
 * 12신살이 연지·일지 양쪽에서 중복되어도 이름 배열에서는 한 번만 표시한다.
 */
export function getSinsal(
  yearGan, yearJi, monthGan, monthJi, dayGan, dayJi, hourGan, hourJi,
  options = {}
) {
  const detailed = getSinsalDetailed(
    yearGan, yearJi, monthGan, monthJi, dayGan, dayJi, hourGan, hourJi, options
  );

  return Object.fromEntries(
    PILLAR_KEYS.map((key) => [
      key,
      [...new Set(detailed.pillars[key].map((item) => item.name))],
    ])
  );
}

/**
 * 대운·세운·월운·일진의 간지와 원국 사이에서 새로 성립하는 신살 계산.
 *
 * saju 형식:
 * {
 *   yearGan, yearJi, monthGan?, monthJi, dayGan, dayJi, hourGan?, hourJi?,
 *   gender?: 'male' | 'female'
 * }
 * target 형식: { gan, ji, type?: 'daeun'|'seun'|'wolun'|'iljin' }
 */
export function getTransitSinsal(saju, target) {
  const yearGan = saju?.yearGan;
  const yearJi = saju?.yearJi;
  const monthGan = saju?.monthGan;
  const monthJi = saju?.monthJi;
  const dayGan = saju?.dayGan;
  const dayJi = saju?.dayJi;
  const targetGan = target?.gan;
  const targetJi = target?.ji;
  const targetGanji = `${targetGan || ''}${targetJi || ''}`;

  if (!isValidGanji(targetGan, targetJi)) {
    return {
      version: SINSAL_POLICY_VERSION,
      target: targetGanji,
      items: [],
      warnings: [`운의 간지 ${targetGanji || '(없음)'}은 실제 60갑자가 아닙니다.`],
    };
  }

  const natalCoreErrors = [];
  if (!isValidGanji(yearGan, yearJi)) {
    natalCoreErrors.push(`원국 year 기둥 ${`${yearGan || ''}${yearJi || ''}` || '(없음)'}은 실제 60갑자가 아닙니다.`);
  }
  if (!isValidGanji(dayGan, dayJi)) {
    natalCoreErrors.push(`원국 day 기둥 ${`${dayGan || ''}${dayJi || ''}` || '(없음)'}은 실제 60갑자가 아닙니다.`);
  }
  if (monthGan && !isValidGanji(monthGan, monthJi)) {
    natalCoreErrors.push(`원국 month 기둥 ${monthGan}${monthJi || ''}은 실제 60갑자가 아닙니다.`);
  }
  if (monthGan) {
    const requiredMonthGan = expectedMonthGan(yearGan, monthJi);
    if (requiredMonthGan && monthGan !== requiredMonthGan) {
      natalCoreErrors.push(`연간 ${yearGan}·월지 ${monthJi}의 월간은 ${requiredMonthGan}이어야 합니다.`);
    }
  }
  if (saju?.hourGan || saju?.hourJi) {
    if (!isValidGanji(saju?.hourGan, saju?.hourJi)) {
      natalCoreErrors.push(`원국 hour 기둥 ${`${saju?.hourGan || ''}${saju?.hourJi || ''}`}은 실제 60갑자가 아닙니다.`);
    }
    const requiredHourGan = expectedHourGan(dayGan, saju?.hourJi);
    if (requiredHourGan && saju?.hourGan !== requiredHourGan) {
      natalCoreErrors.push(`일간 ${dayGan}·시지 ${saju?.hourJi}의 시간은 ${requiredHourGan}이어야 합니다.`);
    }
  }
  if (natalCoreErrors.length) {
    return {
      version: SINSAL_POLICY_VERSION,
      target: targetGanji,
      items: [],
      warnings: natalCoreErrors,
    };
  }

  const items = [];

  function add(name, basis, source, ruleId) {
    const duplicate = items.some(
      (item) => item.name === name && item.basis === basis && item.source === source
    );
    if (!duplicate) items.push({ name, basis, source, ruleId });
  }

  [
    { ji: yearJi, source: 'yearJi', label: '원국 연지' },
    { ji: dayJi, source: 'dayJi', label: '원국 일지' },
  ].filter((base) => JIJI.includes(base.ji)).forEach((base) => {
    Object.entries(TWELVE_SINSAL_MAPS).forEach(([name, map]) => {
      if (map[base.ji] === targetJi) {
        add(
          name,
          `${base.label} ${base.ji} 기준과 운의 지지 ${targetJi}`,
          base.source,
          `twelve.${name}`
        );
      }
    });
  });

  if (CHEONGAN.includes(dayGan)) {
    Object.entries(DAY_GAN_JI_RULES).forEach(([name, map]) => {
      if ((map[dayGan] || '').includes(targetJi)) {
        add(
          name,
          `원국 일간 ${dayGan}과 운의 지지 ${targetJi}`,
          'dayGan',
          `dayGanJi.${name}`
        );
      }
    });

    const cheonju = CHEONJU_COMPONENTS_BY_DAY_GAN[dayGan];
    if (cheonju) {
      const natalGans = [
        saju?.yearGan, saju?.monthGan, saju?.dayGan, saju?.hourGan,
      ].filter((gan) => CHEONGAN.includes(gan));
      const natalJis = [
        saju?.yearJi, saju?.monthJi, saju?.dayJi, saju?.hourJi,
      ].filter((ji) => JIJI.includes(ji));
      const beforeComplete =
        natalGans.includes(cheonju.gan) && natalJis.includes(cheonju.ji);
      const afterComplete =
        (natalGans.includes(cheonju.gan) || targetGan === cheonju.gan) &&
        (natalJis.includes(cheonju.ji) || targetJi === cheonju.ji);
      const targetContributes =
        targetGan === cheonju.gan || targetJi === cheonju.ji;
      if (!beforeComplete && afterComplete && targetContributes) {
        add(
          '천주귀인',
          `원국 일간 ${dayGan}: 운 ${targetGanji}이 식신 천간 ${cheonju.gan} 또는 건록 지지 ${cheonju.ji}를 보충`,
          'dayGan+natal+transit',
          'components.cheonju'
        );
      }
    }
  }

  if ((TAEGEUK_BY_YEAR_GAN[yearGan] || '').includes(targetJi)) {
    add('태극귀인', `원국 연간 ${yearGan}과 운의 지지 ${targetJi}`, 'yearGan', 'yearGanJi.taegeuk');
  }
  if ((MUNCHANG_BY_YEAR_GAN[yearGan] || '').includes(targetJi)) {
    add('문창귀인', `원국 연간 ${yearGan}과 운의 지지 ${targetJi}`, 'yearGan', 'yearGanJi.munchang');
  }
  if ((BOKSEONG_GANJI_BY_YEAR_GAN[yearGan] || []).includes(targetGanji)) {
    add('복성귀인', `원국 연간 ${yearGan}과 운의 간지 ${targetGanji}`, 'yearGan+transitGanji', 'ganji.bokseong');
  }

  const transitChundeok = CHUNDEOK_MAP[monthJi];
  const chundeokMatched =
    (transitChundeok?.type === 'gan' && transitChundeok.value === targetGan) ||
    (transitChundeok?.type === 'ji' && transitChundeok.value === targetJi);
  if (chundeokMatched) {
    add(
      '천덕귀인',
      `원국 월지 ${monthJi}와 운의 ${transitChundeok.type === 'gan' ? '천간' : '지지'} ${transitChundeok.value}`,
      'monthJi',
      'monthJi.chundeok'
    );
  }

  if (WOLDEOK_MAP[monthJi] === targetGan) {
    add('월덕귀인', `원국 월지 ${monthJi}와 운의 천간 ${targetGan}`, 'monthJi', 'monthJi.woldeok');
  }

  if (['갑', '신'].includes(targetGan) || ['묘', '오', '신'].includes(targetJi)) {
    add('현침살', `운의 간지 ${targetGanji}`, 'target', 'character.hyeonchim');
  }

  const natalJis = [
    ['yearJi', saju?.yearJi],
    ['monthJi', saju?.monthJi],
    ['dayJi', saju?.dayJi],
    ['hourJi', saju?.hourJi],
  ].filter(([, ji]) => JIJI.includes(ji));

  GWIMUN_PAIRS.forEach(([a, b]) => {
    natalJis.forEach(([source, natalJi]) => {
      const matched =
        (natalJi === a && targetJi === b) ||
        (natalJi === b && targetJi === a);
      if (matched) {
        add('귀문관살', `원국 ${source} ${natalJi}와 운의 지지 ${targetJi}`, source, `pair.gwimun.${a}${b}`);
      }
    });
  });

  const wonjinTarget = resolveWonjinTarget(yearGan, yearJi, saju?.gender);
  if (wonjinTarget === targetJi) {
    add(
      '원진살',
      `연간 ${yearGan}의 음양·성별 ${normalizeGender(saju?.gender)}·연지 ${yearJi}와 운의 지지 ${targetJi}`,
      'yearGan+yearJi+gender',
      'wonjin.wonjin'
    );
  }

  return {
    version: SINSAL_POLICY_VERSION,
    target: targetGanji,
    items: sortItems(items),
    warnings: normalizeGender(saju?.gender)
      ? []
      : ['성별이 없어 고전식 원진살(元辰)은 계산하지 않았습니다.'],
  };
}

export const SINSAL_CHEONGAN = [...CHEONGAN];
export const SINSAL_JIJI = [...JIJI];

/* 테스트와 기준 공개 화면에서 사용할 수 있는 읽기 전용 조견표. */
export const SINSAL_REFERENCE_TABLES = Object.freeze({
  twelveSinsal: TWELVE_SINSAL_MAPS,
  dayGanJiRules: DAY_GAN_JI_RULES,
  taegeukByYearGan: TAEGEUK_BY_YEAR_GAN,
  munchangByYearGan: MUNCHANG_BY_YEAR_GAN,
  sixtyGanji: SIXTY_GANJI,
  cheonjuComponentsByDayGan: CHEONJU_COMPONENTS_BY_DAY_GAN,
  bokseongGanjiByYearGan: BOKSEONG_GANJI_BY_YEAR_GAN,
  chundeok: CHUNDEOK_MAP,
  woldeok: WOLDEOK_MAP,
  baekhoDayPillars: BAEKHO_JU_LIST,
  goranDayPillars: GORAN_JU_LIST,
  gwimunPairs: GWIMUN_PAIRS,
});
