const cheongan = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const jiji = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// 기준년도: 2024년 = 갑진년
const BASE_YEAR = 2024;
const BASE_GAN = 0; // 갑
const BASE_JI = 4;  // 진

export function getSeun(startYear, count) {
  const seuns = [];
  for (let i = 0; i < count; i++) {
    const year = startYear + i;
    const diff = year - BASE_YEAR;
    const ganIdx = (BASE_GAN + diff % 10 + 100) % 10;
    const jiIdx = (BASE_JI + diff % 12 + 120) % 12;
    seuns.push({
      year,
      gan: cheongan[ganIdx],
      ji: jiji[jiIdx],
    });
  }
  return seuns;
}