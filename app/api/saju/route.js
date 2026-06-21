import { NextResponse } from 'next/server';
import { Lunar, Solar } from 'lunar-typescript';

const cheongan = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const jiji = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const ganMap = {'甲':'갑','乙':'을','丙':'병','丁':'정','戊':'무','己':'기','庚':'경','辛':'신','壬':'임','癸':'계'};
const jiMap = {'子':'자','丑':'축','寅':'인','卯':'묘','辰':'진','巳':'사','午':'오','未':'미','申':'신','酉':'유','戌':'술','亥':'해'};

function getHourJi(hour) {
  const h = Number(hour);
  if (h === 23 || h === 0) return 0;
  return Math.floor((h + 1) / 2);
}

function getHourGan(dayGanIndex, hourJiIndex) {
  const base = [0, 2, 4, 6, 8];
  const start = base[dayGanIndex % 5];
  return (start + hourJiIndex) % 10;
}

export async function POST(request) {
  try {
    const { year, month, day, hour } = await request.json();
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    const h = Number(hour);

    const solar = Solar.fromYmd(y, m, d);
    const lunar = Lunar.fromSolar(solar);
    const bazi = lunar.getEightChar();

    const yearGan = ganMap[bazi.getYearGan()] || bazi.getYearGan();
    const yearJi = jiMap[bazi.getYearZhi()] || bazi.getYearZhi();
    const monthGan = ganMap[bazi.getMonthGan()] || bazi.getMonthGan();
    const monthJi = jiMap[bazi.getMonthZhi()] || bazi.getMonthZhi();
    const dayGan = ganMap[bazi.getDayGan()] || bazi.getDayGan();
    const dayJi = jiMap[bazi.getDayZhi()] || bazi.getDayZhi();

    const dayGanIdx = cheongan.indexOf(dayGan);
    const hourJiIdx = getHourJi(h);
    const hourGanIdx = getHourGan(dayGanIdx, hourJiIdx);

    const saju = {
      year: { gan: yearGan, ji: yearJi },
      month: { gan: monthGan, ji: monthJi },
      day: { gan: dayGan, ji: dayJi },
      hour: { gan: cheongan[hourGanIdx], ji: jiji[hourJiIdx] },
    };

    return NextResponse.json({ success: true, saju });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}