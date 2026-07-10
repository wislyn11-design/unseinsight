import { Lunar } from 'lunar-typescript';
import { getSipseong } from './sipseong.js';
import { get12un } from './un12.js';

const cheongan = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const jiji = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const ganMap = {'甲':'갑','乙':'을','丙':'병','丁':'정','戊':'무','己':'기','庚':'경','辛':'신','壬':'임','癸':'계'};
const jiMap = {'子':'자','丑':'축','寅':'인','卯':'묘','辰':'진','巳':'사','午':'오','未':'미','申':'신','酉':'유','戌':'술','亥':'해'};


// 💡 12절기 (한국어 + 중국어 간체/번체 모두 포함하여 라이브러리 언어 설정과 무관하게 완벽하게 잡아냅니다)
const MAJOR_JIEQI = [
  '입춘', '경칩', '청명', '입하', '망종', '소서', '입추', '백로', '한로', '입동', '대설', '소한',
  '立春', '惊蛰', '驚蟄', '清明', '立夏', '芒种', '芒種', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'
];


export function getDaeun(lunar, solar, gender, monthGan, monthJi) {
  try {
    const yearGanIdx = cheongan.indexOf(
      ganMap[lunar.getEightChar().getYearGan()] || lunar.getEightChar().getYearGan()
    );
    const isYangYear = yearGanIdx % 2 === 0;
    const isForward = (gender === '남' && isYangYear) || (gender === '여' && !isYangYear);

    let jieqiDays = 0;

    // 💡 다음 또는 이전 '진짜 12절기'까지의 날짜를 계산합니다.
    if (isForward) {
      let nextSolar = solar;
      for (let i = 1; i <= 60; i++) {
        nextSolar = nextSolar.next(1);
        const nextLunar = Lunar.fromSolar(nextSolar);
        const jieqi = nextLunar.getJieQi();
        if (jieqi && MAJOR_JIEQI.includes(jieqi)) {
          jieqiDays = i;
          break;
        }
      }
    } else {
      let prevSolar = solar;
      for (let i = 1; i <= 60; i++) {
        prevSolar = prevSolar.next(-1);
        const prevLunar = Lunar.fromSolar(prevSolar);
        const jieqi = prevLunar.getJieQi();
        if (jieqi && MAJOR_JIEQI.includes(jieqi)) {
          jieqiDays = i;
          break;
        }
      }
    }

    // 💡 무조건 3으로 나누고 반올림합니다. 계산값이 0이면 1살로 보정합니다.
    let daeunSu = Math.round(jieqiDays / 3);
    if (daeunSu === 0) daeunSu = 1;

    const monthGanIdx = cheongan.indexOf(monthGan);
    const monthJiIdx = jiji.indexOf(monthJi);

    const daeuns = [];
    for (let i = 1; i <= 11; i++) {
      let ganIdx, jiIdx;
      if (isForward) {
        ganIdx = (monthGanIdx + i) % 10;
        jiIdx = (monthJiIdx + i) % 12;
      } else {
        ganIdx = (monthGanIdx - i + 100) % 10;
        jiIdx = (monthJiIdx - i + 120) % 12;
      }
      daeuns.push({
        startAge: daeunSu + (i - 1) * 10,
        gan: cheongan[ganIdx],
        ji: jiji[jiIdx],
      });
    }

    return { daeunSu, isForward, daeuns };
  } catch (e) {
    console.log('getDaeun 오류:', e.message);
    return { daeunSu: 1, isForward: true, daeuns: [] };
  }
}