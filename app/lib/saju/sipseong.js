const cheongan = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const sipseongList = ['비견','겁재','식신','상관','편재','정재','편관','정관','편인','정인'];

export function getSipseong(ilgan, target) {
  const ilIdx = cheongan.indexOf(ilgan);
  const tIdx = cheongan.indexOf(target);
  if (ilIdx === -1 || tIdx === -1) return '';
  
  // 오행 기준 (갑을=목, 병정=화, 무기=토, 경신=금, 임계=수)
  const ohaeng = [0,0,1,1,2,2,3,3,4,4];
  // 음양 (갑병무경임=양, 을정기신계=음)
  const yinyang = [0,1,0,1,0,1,0,1,0,1];
  
  const ilOh = ohaeng[ilIdx];
  const tOh = ohaeng[tIdx];
  const ilYin = yinyang[ilIdx];
  const tYin = yinyang[tIdx];
  
  // 오행 관계
  const ohDiff = (tOh - ilOh + 5) % 5;
  const sameYin = ilYin === tYin;
  
  if (ohDiff === 0) return sameYin ? '비견' : '겁재';
  if (ohDiff === 1) return sameYin ? '식신' : '상관';
  if (ohDiff === 2) return sameYin ? '편재' : '정재';
  if (ohDiff === 3) return sameYin ? '편관' : '정관';
  if (ohDiff === 4) return sameYin ? '편인' : '정인';
  return '';
}