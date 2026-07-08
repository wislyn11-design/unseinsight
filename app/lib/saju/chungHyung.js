// lib/saju/chungHyung.js

export function getChungHyung(jis, dayJi) {
  const result = {};
  jis.forEach(ji => result[ji] = []);

  // 충 (衝)
  const chungPairs = [
    ['자','오'], ['축','미'], ['인','신'], 
    ['묘','유'], ['진','술'], ['사','해']
  ];
  chungPairs.forEach(([a, b]) => {
    if (jis.includes(a) && jis.includes(b)) {
      if (a !== dayJi) result[a].push('충');
      if (b !== dayJi) result[b].push('충');
    }
  });

  // 육합 (六合)
  const yukHapPairs = [
    ['자','축'], ['인','해'], ['묘','술'],
    ['진','유'], ['사','신'], ['오','미']
  ];
  yukHapPairs.forEach(([a, b]) => {
    if (jis.includes(a) && jis.includes(b)) {
      if (a !== dayJi && !result[a].includes('육합')) result[a].push('육합');
      if (b !== dayJi && !result[b].includes('육합')) result[b].push('육합');
    }
  });

  // 형 (刑)
  const hyungPairs = [
    ['자','묘'], 
    ['술','해']
  ];
  hyungPairs.forEach(([a, b]) => {
    if (jis.includes(a) && jis.includes(b)) {
      if (a !== dayJi && !result[a].includes('형')) result[a].push('형');
      if (b !== dayJi && !result[b].includes('형')) result[b].push('형');
    }
  });

  // 해 (害)
  const haePairs = [
    ['자','미'], ['축','오'], ['인','사'], 
    ['묘','진'], ['신','해'], ['유','술']
  ];
  haePairs.forEach(([a, b]) => {
    if (jis.includes(a) && jis.includes(b)) {
      if (a !== dayJi && !result[a].includes('해')) result[a].push('해');
      if (b !== dayJi && !result[b].includes('해')) result[b].push('해');
    }
  });

  // 파 (破)
  const paPairs = [
    ['자','유'], ['유','자'],
    ['축','진'], ['진','축'],
    ['인','해'], ['해','인'],
    ['묘','오'], ['오','묘'],
    ['사','신'], ['신','사'],
    ['술','미'], ['미','술']
  ];
  paPairs.forEach(([a, b]) => {
    if (jis.includes(a) && jis.includes(b)) {
      if (a !== dayJi && !result[a].includes('파')) result[a].push('파');
      if (b !== dayJi && !result[b].includes('파')) result[b].push('파');
    }
  });

  // 천라 (天羅)
  if (jis.includes('술') && jis.includes('해')) {
    if ('술' !== dayJi && !result['술'].includes('천라')) result['술'].push('천라');
    if ('해' !== dayJi && !result['해'].includes('천라')) result['해'].push('천라');
  }

  // 지망 (地網)
  if (jis.includes('진') && jis.includes('사')) {
    if ('진' !== dayJi && !result['진'].includes('지망')) result['진'].push('지망');
    if ('사' !== dayJi && !result['사'].includes('지망')) result['사'].push('지망');
  }

  // 정렬
  jis.forEach(ji => {
    const hasCh = result[ji].includes('충');
    const hasYuk = result[ji].includes('육합');
    const hasHyung = result[ji].includes('형');
    const hasHae = result[ji].includes('해');
    const hasPa = result[ji].includes('파');
    const hasSam = result[ji].includes('삼합');
    const hasWon = result[ji].includes('원진');
    const hasGwi = result[ji].includes('귀문');
    const hasCL = result[ji].includes('천라');
    const hasZM = result[ji].includes('지망');

    result[ji] = result[ji].filter(r => 
      !['충','육합','형','해','파','삼합','원진','귀문','천라','지망'].includes(r)
    );

    if (hasCh) result[ji].unshift('충');
    if (hasYuk) result[ji].push('육합');
    if (hasHyung) result[ji].push('형');
    if (hasHae) result[ji].push('해');
    if (hasPa) result[ji].push('파');
    if (hasSam) result[ji].push('삼합');
    if (hasWon) result[ji].push('원진');
    if (hasGwi) result[ji].push('귀문');
    if (hasCL) result[ji].push('천라');
    if (hasZM) result[ji].push('지망');
  });

  return result;
}