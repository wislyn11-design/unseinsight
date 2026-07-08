const cheongan = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const jiji = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const BASE_MONTH_JI = 2; // 인(寅)

export function getWolun(year, yearGan, yearJi) {
  const months = [];

  // 1월(축월): 전년도 연간 기준
  const prevYearGanIdx = (cheongan.indexOf(yearGan) - 1 + 10) % 10;
  const prevMonthGanStart = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0][prevYearGanIdx];
  // 전년 인월부터 11번째가 축월
  const janGanIdx = (prevMonthGanStart + 11) % 10;
  const janJiIdx = 1; // 축
  months.push({
    month: 1,
    year,
    gan: cheongan[janGanIdx],
    ji: jiji[janJiIdx],
  });

  // 2월~12월: 해당 연도 연간 기준
  const yearGanIdx = cheongan.indexOf(yearGan);
  const monthGanStart = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0][yearGanIdx];
  for (let i = 0; i < 11; i++) {
    const monthNum = i + 2;
    const ganIdx = (monthGanStart + i) % 10;
    const jiIdx = (BASE_MONTH_JI + i) % 12;
    months.push({
      month: monthNum,
      year,
      gan: cheongan[ganIdx],
      ji: jiji[jiIdx],
    });
  }

  return months.sort((a, b) => a.month - b.month);
}