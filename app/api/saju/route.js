import { NextResponse } from 'next/server';
import { Lunar, Solar } from 'lunar-typescript';
import { getSipseong } from '../../lib/saju/sipseong.js';
import { get12un } from '../../lib/saju/un12.js';
import { getNaeum } from '../../lib/saju/naeum.js';
import { getChungHyung } from '../../lib/saju/chungHyung.js';
import { getOhaengCount } from '../../lib/saju/ohaeng.js';
import { getSinsal } from '../../lib/saju/sinsal.js';
import { getGongmang } from '../../lib/saju/gongmang.js';
import { getJijanggan } from '../../lib/saju/jijanggan.js';
import { getDaeun } from '../../lib/saju/daeun.js';
import { convertLunarToSolar } from '../../lib/saju/lunarConverter.js';
// 💡 불필요해진 solarTermsKASI.json은 더 이상 사용하지 않아도 됩니다.


// 💡 파일의 가장 위쪽 어딘가에 이 두 줄을 반드시 추가해 주세요!
export const runtime = 'edge'; // Vercel의 10초 제한을 우회하는 엣지 런타임 적용
export const maxDuration = 60; // 최대 대기 시간을 60초로 넉넉하게 연장



// 💡 일간(태어난 날)을 기준으로 천을귀인을 찾는 함수
function getCheonEulGwiin(dayGan) {
  const map = {
    '갑': '축미', '무': '축미', '경': '축미',
    '을': '자신', '기': '자신',
    '병': '해유', '정': '해유',
    '신': '인오',
    '임': '묘사', '계': '묘사'
  };
  return map[dayGan] || '';
}



// ===================================================================
// 💡 [새로 추가] 절기로부터 흐른 날짜를 계산해 정확한 월령(사령)을 찾는 함수
function getSaryeong(solar, lunar, monthJi) {
  try {
    const prevJie = lunar.getPrevJie(); // 직전 절기 (입추 등)
    const jieSolar = prevJie.getSolar();
    
    const birthTime = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay(), solar.getHour(), solar.getMinute()).getTime();
    const jieTime = new Date(jieSolar.getYear(), jieSolar.getMonth() - 1, jieSolar.getDay(), jieSolar.getHour(), jieSolar.getMinute()).getTime();
    
    // 절기로부터 몇 일이 지났는지 계산
    const daysPassed = (birthTime - jieTime) / (1000 * 60 * 60 * 24);

    // 지지별 지장간 사령(당직) 일수 분포표
    const saryeongDays = {
      '자': [{d: 10, g: '임'}, {d: 30, g: '계'}],
      '축': [{d: 9, g: '계'}, {d: 12, g: '신'}, {d: 30, g: '기'}],
      '인': [{d: 7, g: '무'}, {d: 14, g: '병'}, {d: 30, g: '갑'}],
      '묘': [{d: 10, g: '갑'}, {d: 30, g: '을'}],
      '진': [{d: 9, g: '을'}, {d: 12, g: '계'}, {d: 30, g: '무'}],
      '사': [{d: 7, g: '무'}, {d: 14, g: '경'}, {d: 30, g: '병'}],
      '오': [{d: 10, g: '병'}, {d: 19, g: '기'}, {d: 30, g: '정'}],
      '미': [{d: 9, g: '정'}, {d: 12, g: '을'}, {d: 30, g: '기'}],
      '신': [{d: 7, g: '무'}, {d: 14, g: '임'}, {d: 30, g: '경'}],
      '유': [{d: 10, g: '경'}, {d: 30, g: '신'}],
      '술': [{d: 9, g: '신'}, {d: 12, g: '정'}, {d: 30, g: '무'}],
      '해': [{d: 7, g: '무'}, {d: 14, g: '갑'}, {d: 30, g: '임'}]
    };

    const sections = saryeongDays[monthJi];
    if (!sections) return '';
    
    for (let i = 0; i < sections.length; i++) {
      if (daysPassed <= sections[i].d) return sections[i].g;
    }
    return sections[sections.length - 1].g;

  } catch (e) {
    // 에러 발생 시 기존처럼 마지막 본기 반환
    const jjg = getJijanggan(monthJi);
    return jjg[jjg.length - 1] || '';
  }
}
// ===================================================================




const cheongan = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const jiji = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const ganMap = {'甲':'갑','乙':'을','丙':'병','丁':'정','戊':'무','己':'기','庚':'경','辛':'신','壬':'임','癸':'계'};
const jiMap = {'子':'자','丑':'축','寅':'인','卯':'묘','辰':'진','巳':'사','午':'오','未':'미','申':'신','酉':'유','戌':'술','亥':'해'};

function getHourJi(hour) {
  const h = Number(hour);
  if (h === -1) return -1;
  if (h === 23 || h === 0) return 0;
  return Math.floor((h + 1) / 2);
}

function getHourGan(dayGanIndex, hourJiIndex) {
  const base = [0, 2, 4, 6, 8];
  return (base[dayGanIndex % 5] + hourJiIndex) % 10;
}

function getDayPillarDirect(solar) {
  const BASE = new Date(Date.UTC(2000, 0, 1));
  const target = new Date(Date.UTC(solar.getYear(), solar.getMonth() - 1, solar.getDay()));
  const diff = Math.round((target - BASE) / (1000 * 60 * 60 * 24));
  const idx = ((54 + diff) % 60 + 60) % 60;
  const gan = cheongan[idx % 10];
  const ji = jiji[idx % 12];
  return { gan, ji };
}

// 서머타임(일광절약시간제) 적용 기간
const dstPeriods = [
  { start: new Date(1948, 5, 1, 0, 0).getTime(),  end: new Date(1948, 8, 13, 0, 0).getTime() },
  { start: new Date(1949, 3, 3, 0, 0).getTime(),  end: new Date(1949, 8, 11, 0, 0).getTime() },
  { start: new Date(1950, 3, 1, 0, 0).getTime(),  end: new Date(1950, 8, 10, 0, 0).getTime() },
  { start: new Date(1951, 4, 6, 0, 0).getTime(),  end: new Date(1951, 8, 9, 0, 0).getTime() },
  { start: new Date(1955, 4, 5, 0, 0).getTime(),  end: new Date(1955, 8, 9, 0, 0).getTime() },
  { start: new Date(1956, 4, 20, 0, 0).getTime(), end: new Date(1956, 8, 30, 0, 0).getTime() },
  { start: new Date(1957, 4, 5, 0, 0).getTime(),  end: new Date(1957, 8, 22, 0, 0).getTime() },
  { start: new Date(1958, 4, 4, 0, 0).getTime(),  end: new Date(1958, 8, 21, 0, 0).getTime() },
  { start: new Date(1959, 4, 3, 0, 0).getTime(),  end: new Date(1959, 8, 20, 0, 0).getTime() },
  { start: new Date(1960, 4, 1, 0, 0).getTime(),  end: new Date(1960, 8, 18, 0, 0).getTime() },
  { start: new Date(1987, 4, 10, 2, 0).getTime(), end: new Date(1987, 9, 11, 3, 0).getTime() },
  { start: new Date(1988, 4, 8, 2, 0).getTime(),  end: new Date(1988, 9, 9, 3, 0).getTime() },
];

function isDSTPeriod(year, month, day, hour, minute) {
  const t = new Date(year, month - 1, day, hour, minute).getTime();
  return dstPeriods.some(p => t >= p.start && t < p.end);
}

export async function POST(request) {
  try {
    const { year, month, day, hour, calType, isLeap, gender, yajasi, hourInput } = await request.json();
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    const h = Number(hour);

    // 1. 시간 보정을 가장 먼저 실행합니다 (핵심 포인트!)
    const rawHour = hourInput ? parseInt(hourInput.slice(0, hourInput.length - 2)) : h;
    const rawMinute = hourInput ? parseInt(hourInput.slice(-2)) : 0;

    let correctedHour = h;
    let correctedMinute = 0;
    
    const noCorrection = (y === 1954 && (m > 3 || (m === 3 && d >= 21))) || (y > 1954 && y < 1961) || (y === 1961 && (m < 8 || (m === 8 && d <= 9)));

    if (hourInput) {
      if (noCorrection) {
        correctedHour = rawHour;
        correctedMinute = rawMinute;
      } else {
        const isDST = isDSTPeriod(y, m, d, rawHour, rawMinute);
        const correctionMin = isDST ? 90 : 30;
        let totalMin = rawHour * 60 + rawMinute - correctionMin;
        if (totalMin < 0) totalMin += 24 * 60; // 날짜 오프셋은 아래 야자시/일주 로직과 별도로 처리
        correctedHour = Math.floor(totalMin / 60);
        correctedMinute = totalMin % 60;
      }
    }

    // 2. 양력 날짜 변환
    let baseYear = y, baseMonth = m, baseDay = d;
    if (calType === '음력') {
      const solarData = convertLunarToSolar(y, m, d, isLeap === true);
      baseYear = solarData.year;
      baseMonth = solarData.month;
      baseDay = solarData.day;
    }

    // 💡 3. 정확한 '시간'과 '분'을 포함하여 태양력 객체 생성!
    // 이렇게 하면 lunar-typescript가 1995년 청명 진입 시각(15:05)을 정확히 인식합니다.
    const solar = Solar.fromYmdHms(baseYear, baseMonth, baseDay, correctedHour, correctedMinute, 0);
    const lunar = Lunar.fromSolar(solar); 
    const bazi = lunar.getEightChar();

    // 💡 4. JSON 파일 비교 없이, 정밀 계산된 라이브러리에서 년주/월주를 다이렉트로 가져옵니다.
    const yearGan = ganMap[bazi.getYearGan()] || bazi.getYearGan();
    const yearJi  = jiMap[bazi.getYearZhi()] || bazi.getYearZhi();
    const monthGan = ganMap[bazi.getMonthGan()] || bazi.getMonthGan();
    const monthJi  = jiMap[bazi.getMonthZhi()] || bazi.getMonthZhi();

   // 5. 일주 계산 (선생님의 기존 원본 날짜 유지 로직)
   let { gan: dayGan, ji: dayJi } = getDayPillarDirect(solar);
   let dayGanIdxForHour = cheongan.indexOf(dayGan); // 시주를 계산할 때 쓸 '기준 일간'

   // 💡 [야자시/조자시 완벽 처리 로직]
   // 23시는 자시(子時)의 시작입니다.
   if (correctedHour === 23) {
     if (yajasi === true) {
       // [야자시 적용 (현대)]: 일주는 '오늘'을 유지하지만, 시주는 '내일'의 일간을 기준으로 도출합니다.
       dayGanIdxForHour = (dayGanIdxForHour + 1) % 10;
     } else {
       // [야자시 미적용 (고전)]: 밤 11시가 넘으면 일주와 시주 모두 '내일'로 아예 넘겨버립니다.
       const nextDayIdx = (cheongan.indexOf(dayGan) + 1) % 10;
       const nextJiIdx = (jiji.indexOf(dayJi) + 1) % 12;
       dayGan = cheongan[nextDayIdx];
       dayJi = jiji[nextJiIdx];
       dayGanIdxForHour = nextDayIdx; // 시주도 내일 일간 기준
     }
   }

   // 6. 시주 계산
   const dayGanIdx = cheongan.indexOf(dayGan); // 실제 화면에 출력될 일주
   const hourJiIdx = getHourJi(correctedHour);
   // 💡 시주를 계산할 때는 'dayGanIdxForHour(시주 전용 기준 일간)'을 사용합니다.
   const hourGanIdx = hourJiIdx === -1 ? -1 : getHourGan(dayGanIdxForHour, hourJiIdx); 
   const hourGan = hourGanIdx === -1 ? '' : cheongan[hourGanIdx];
   const hourJi = hourJiIdx === -1 ? '' : jiji[hourJiIdx];



    function buildPillar(gan, ji, isDay) {
      const jjg = getJijanggan(ji);
      return {
        gan, ji,
        sipseong: isDay ? '일간(나)' : getSipseong(dayGan, gan),
        jiSipseong: isDay ? '' : getSipseong(dayGan, jjg[jjg.length - 1] || ''),
        jijanggan: jjg,
        un12: get12un(dayGan, ji),
        un12Self: get12un(gan, ji),
        naeum: getNaeum(gan, ji),
      };
    }

    const yearPillar  = buildPillar(yearGan, yearJi, false);
    const monthPillar = buildPillar(monthGan, monthJi, false);
    const dayPillar   = buildPillar(dayGan, dayJi, true);
    const hourPillar  = buildPillar(hourGan, hourJi, false);

    const jis = [hourJi, dayJi, monthJi, yearJi].filter(Boolean);
    const chungHyung = getChungHyung(jis, dayJi);

    chungHyung[dayJi] = [];

    // 암합 로직
    const amhapJiPairs = [['자','술'], ['인','축'], ['오','해'], ['묘','신']];
    for (let i = 0; i < jis.length; i++) {
      for (let j = i + 1; j < jis.length; j++) {
        const a = jis[i], b = jis[j];
        if (amhapJiPairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) {
          if (a !== dayJi) chungHyung[a].push('암합');
          if (b !== dayJi) chungHyung[b].push('암합');
        }
      }
    }

    const yearGongmang = getGongmang(yearGan, yearJi);
    const dayGongmang  = getGongmang(dayGan, dayJi);

    const ohaengCount = getOhaengCount([
      { gan: yearGan, ji: yearJi },
      { gan: monthGan, ji: monthJi },
      { gan: dayGan, ji: dayJi },
      { gan: hourGan, ji: hourJi },
    ]);

    const sinsal = getSinsal(yearGan, yearJi, monthGan, monthJi, dayGan, dayJi, hourGan, hourJi);
    const daeun = getDaeun(lunar, solar, gender || '남', monthGan, monthJi);

// 💡 [새로 추가] 만들어진 대운 배열을 하나씩 돌면서 신살을 계산해 붙여줍니다!
daeun.daeuns = daeun.daeuns.map(d => {
  // 대운의 글자(d.gan, d.ji)를 마치 시주(hour)인 것처럼 넣어서 3단콤보 신살 공장을 돌립니다.
  const dSinsal = getSinsal(yearGan, yearJi, monthGan, monthJi, dayGan, dayJi, d.gan, d.ji);
  return {
    ...d,
    sinsal: dSinsal.hour // 시주 자리에 맺힌 결과를 대운의 신살로 빼옵니다.
  };
});


    function getRelationMap(jis, chungHyung, excludeJi = null) {
      const relationTypes = ['충','형','파','해','삼합','육합','원진','방합','반합','귀문','지망','암합','천라'];
      const map = {};
      jis.forEach(ji => { map[ji] = {}; });
      relationTypes.forEach(rel => {
        const involved = jis.filter(ji => (chungHyung[ji] || []).includes(rel) && ji !== excludeJi);
        if (involved.length === 0) return;
        involved.forEach(ji => {
          const partners = involved.filter(p => p !== ji);
          map[ji][rel] = partners;
        });
      });
      return map;
    }

    chungHyung[dayJi] = [];
    const relationMap = getRelationMap(jis, chungHyung, dayJi);

    
   // 💡 [여기에 꼭 추가해야 합니다!] 천을귀인과 월령을 계산하는 로직
   const cheonEul = getCheonEulGwiin(dayGan);
   // 💡 날짜를 계산하는 새로운 정밀 사령 함수 적용!
   const wolRyeong = getSaryeong(solar, lunar, monthJi);


    const saju = {
      year:  { ...yearPillar,  chungHyung: chungHyung[yearJi]  || [], relationMap: relationMap[yearJi]  || {}, sinsal: sinsal.year },
      month: { ...monthPillar, chungHyung: chungHyung[monthJi] || [], relationMap: relationMap[monthJi] || {}, sinsal: sinsal.month },
      day:   { ...dayPillar,   chungHyung: [], relationMap: {}, sinsal: sinsal.day },
      hour:  { ...hourPillar,  chungHyung: chungHyung[hourJi]  || [], relationMap: relationMap[hourJi]  || {}, sinsal: sinsal.hour },
      solarDate: solar.toYmd(),
      yearGongmang,
      dayGongmang,
      ohaengCount,
      daeun,
      cheonEul,   // 👈 철자 확인 (대소문자 구분)
      wolRyeong,  // 👈 철자 확인 (대소문자 구분)
    };

    return NextResponse.json({ 
      success: true, 
      saju,
      metadata: {
        lunarInput: calType === '음력' ? `${y}년 ${m}월 ${d}일 (음력)` : null,
        convertedSolar: `${solar.getYear()}년 ${solar.getMonth()}월 ${solar.getDay()}일 (양력)`,
        isDST: isDSTPeriod(y, m, d, rawHour, rawMinute),
        yajasi: yajasi || false,
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}