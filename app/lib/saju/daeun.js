import { Lunar } from 'lunar-typescript';
import { getSipseong } from './sipseong.js';
import { get12un } from './un12.js';

const cheongan = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const jiji = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const ganMap = {'甲':'갑','乙':'을','丙':'병','丁':'정','戊':'무','己':'기','庚':'경','辛':'신','壬':'임','癸':'계'};
const jiMap = {'子':'자','丑':'축','寅':'인','卯':'묘','辰':'진','巳':'사','午':'오','未':'미','申':'신','酉':'유','戌':'술','亥':'해'};

export function getDaeun(lunar, solar, gender, monthGan, monthJi) {
  try {
    const yearGanIdx = cheongan.indexOf(
      ganMap[lunar.getEightChar().getYearGan()] || lunar.getEightChar().getYearGan()
    );
    const isYangYear = yearGanIdx % 2 === 0;
    const isForward = (gender === '남' && isYangYear) || (gender === '여' && !isYangYear);

    let jieqiDays = 0;

    if (isForward) {
      const todayLunar = Lunar.fromSolar(solar);
      if (todayLunar && todayLunar.getJieQi && todayLunar.getJieQi()) {
        jieqiDays = 0;
      } else {
        let nextSolar = solar;
        for (let i = 1; i <= 60; i++) {
          nextSolar = nextSolar.next(1);
          if (nextSolar.isJieQi && nextSolar.isJieQi()) {
            jieqiDays = i;
            break;
          }
          const nextLunar = Lunar.fromSolar(nextSolar);
          if (nextLunar && nextLunar.getJieQi && nextLunar.getJieQi()) {
            jieqiDays = i;
            break;
          }
        }
      }
    } else {
      const todayLunar = Lunar.fromSolar(solar);
      let prevSolar = solar;
      for (let i = 1; i <= 60; i++) {
        prevSolar = prevSolar.next(-1);
        if (prevSolar.isJieQi && prevSolar.isJieQi()) {
          jieqiDays = i;
          break;
        }
        const prevLunar = Lunar.fromSolar(prevSolar);
        if (prevLunar && prevLunar.getJieQi && prevLunar.getJieQi()) {
          jieqiDays = i;
          break;
        }
      }
    }

    // 💡 [버그 수정 완료] 무조건 3으로 나누고 반올림합니다. 계산값이 0이면 1살로 보정합니다.
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