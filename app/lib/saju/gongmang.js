const cheongan = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const jiji = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

export function getGongmang(gan, ji) {
  const ganIdx = cheongan.indexOf(gan);
  const jiIdx = jiji.indexOf(ji);
  if (ganIdx === -1 || jiIdx === -1) return [];
  const gmStart = (jiIdx - ganIdx % 12 + 12) % 12;
  const gm1 = (gmStart + 10) % 12;
  const gm2 = (gmStart + 11) % 12;
  return [jiji[gm1], jiji[gm2]];
}