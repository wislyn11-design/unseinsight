const cheongan = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const jiji = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

export function getSinsal(yearGan, yearJi, monthGan, monthJi, dayGan, dayJi, hourGan, hourJi) {
  const result = { year: [], month: [], day: [], hour: [] };
  const gans = { year: yearGan, month: monthGan, day: dayGan, hour: hourGan };
  const jis = { year: yearJi, month: monthJi, day: dayJi, hour: hourJi };

  function addToJi(targetJi, name) {
    Object.entries(jis).forEach(([key, ji]) => {
      if (ji && ji === targetJi) result[key].push(name);
    });
  }

  function addToGan(targetGan, name) {
    Object.entries(gans).forEach(([key, gan]) => {
      if (gan && gan === targetGan) result[key].push(name);
    });
  }

  // 💡 [핵심] 천을귀인 앱처럼 년지, 월지, 일지 3가지를 모두 기준으로 샅샅이 찾습니다.
  const bases = [yearJi, monthJi, dayJi].filter(Boolean);
  
  function add12Sinsal(map, name) {
    bases.forEach(baseJi => {
      const targetJi = map[baseJi];
      if (targetJi) {
        Object.entries(jis).forEach(([key, ji]) => {
          if (ji === targetJi) result[key].push(name); 
        });
      }
    });
  }

  // ==========================================
  // 1. 12신살 
  // ==========================================
  const geopMap = { 자:'사', 축:'인', 인:'해', 묘:'신', 진:'사', 사:'인', 오:'해', 미:'신', 신:'사', 유:'인', 술:'해', 해:'신' };
  add12Sinsal(geopMap, '겁살');

  const jaesalMap = { 자:'오', 축:'묘', 인:'자', 묘:'유', 진:'오', 사:'묘', 오:'자', 미:'유', 신:'오', 유:'묘', 술:'자', 해:'유' };
  add12Sinsal(jaesalMap, '재살');

  const chunsalMap = { 자:'미', 축:'진', 인:'축', 묘:'술', 진:'미', 사:'진', 오:'축', 미:'술', 신:'미', 유:'진', 술:'축', 해:'술' };
  add12Sinsal(chunsalMap, '천살');

  const jisalMap = { 자:'인', 축:'해', 인:'신', 묘:'사', 진:'인', 사:'해', 오:'신', 미:'사', 신:'인', 유:'해', 술:'신', 해:'사' };
  add12Sinsal(jisalMap, '지살');

  // 💡 천을귀인 앱의 용어에 맞게 '도화살' 대신 '년살'로 표기합니다.
  const nyeonMap = { 자:'유', 축:'오', 인:'묘', 묘:'자', 진:'유', 사:'오', 오:'묘', 미:'자', 신:'유', 유:'오', 술:'묘', 해:'자' };
  add12Sinsal(nyeonMap, '년살'); 

  const wolsalMap = { 자:'축', 축:'술', 인:'미', 묘:'진', 진:'축', 사:'술', 오:'미', 미:'진', 신:'축', 유:'술', 술:'미', 해:'진' };
  add12Sinsal(wolsalMap, '월살');

  const mangshinMap = { 자:'묘', 축:'자', 인:'유', 묘:'오', 진:'묘', 사:'자', 오:'유', 미:'오', 신:'묘', 유:'자', 술:'유', 해:'오' };
  add12Sinsal(mangshinMap, '망신살');

  const jangsungMap = { 자:'자', 축:'유', 인:'오', 묘:'묘', 진:'자', 사:'유', 오:'오', 미:'묘', 신:'자', 유:'유', 술:'오', 해:'묘' };
  add12Sinsal(jangsungMap, '장성살');

  const bananMap = { 자:'술', 축:'해', 인:'자', 묘:'축', 진:'인', 사:'묘', 오:'진', 미:'사', 신:'오', 유:'미', 술:'신', 해:'유' };
  add12Sinsal(bananMap, '반안살');

  const yeokmaMap = { 자:'인', 축:'해', 인:'신', 묘:'사', 진:'인', 사:'해', 오:'신', 미:'사', 신:'인', 유:'해', 술:'신', 해:'사' };
  add12Sinsal(yeokmaMap, '역마살');

  const yukhaeMap = { 자:'묘', 축:'자', 인:'유', 묘:'오', 진:'묘', 사:'자', 오:'유', 미:'오', 신:'묘', 유:'자', 술:'유', 해:'오' };
  add12Sinsal(yukhaeMap, '육해살');

  const hwagaeMap = { 자:'진', 축:'축', 인:'술', 묘:'미', 진:'진', 사:'축', 오:'술', 미:'미', 신:'진', 유:'축', 술:'술', 해:'미' };
  add12Sinsal(hwagaeMap, '화개살');

  // ==========================================
  // 2. 주요 귀인 및 기타 신살 
  // ==========================================
  const chuneulMap = { 갑:'축미', 을:'자신', 병:'해유', 정:'해유', 무:'축미', 기:'자신', 경:'축미', 신:'인오', 임:'묘사', 계:'묘사' };
  (chuneulMap[dayGan] || '').split('').forEach(ji => addToJi(ji, '천을귀인'));

  const taegukMap = { 갑:'자오', 을:'자오', 병:'묘유', 정:'묘유', 무:'진술축미', 기:'진술축미', 경:'인해', 신:'인해', 임:'사신', 계:'사신' };
  (taegukMap[dayGan] || '').split('').forEach(ji => addToJi(ji, '태극귀인'));

  const chundeokMap = { 인:'정', 묘:'신', 진:'임', 사:'신', 오:'병', 미:'갑', 신:'계', 유:'인', 술:'병', 해:'을', 자:'경', 축:'을' };
  if (chundeokMap[monthJi]) addToGan(chundeokMap[monthJi], '천덕귀인');

  const woldeokMap = { 인:'병', 묘:'갑', 진:'임', 사:'경', 오:'병', 미:'갑', 신:'임', 유:'경', 술:'병', 해:'갑', 자:'임', 축:'경' };
  if (woldeokMap[monthJi]) addToGan(woldeokMap[monthJi], '월덕귀인');

  const amrokMap = { 갑:'해', 을:'술', 병:'신', 정:'미', 무:'신', 기:'미', 경:'사', 신:'진', 임:'인', 계:'축' };
  if (amrokMap[dayGan]) addToJi(amrokMap[dayGan], '암록');

  const geumyeoMap = { 갑:'진', 을:'사', 병:'미', 정:'신', 무:'미', 기:'신', 경:'술', 신:'해', 임:'축', 계:'인' };
  if (geumyeoMap[dayGan]) addToJi(geumyeoMap[dayGan], '금여');

  // 💡 천을귀인 앱에 나오는 '건록' 추가
  const geollokMap = { 갑:'인', 을:'묘', 병:'사', 정:'오', 무:'사', 기:'오', 경:'신', 신:'유', 임:'해', 계:'자' };
  if (geollokMap[dayGan]) addToJi(geollokMap[dayGan], '건록');

  const hakdangMap = { 갑:'해', 을:'오', 병:'인', 정:'유', 무:'인', 기:'유', 경:'사', 신:'자', 임:'신', 계:'묘' };
  if (hakdangMap[dayGan]) addToJi(hakdangMap[dayGan], '학당귀인');

  const munchangMap = { 갑:'사', 을:'오', 병:'신', 정:'유', 무:'신', 기:'유', 경:'해', 신:'자', 임:'인', 계:'묘' };
  if (munchangMap[dayGan]) addToJi(munchangMap[dayGan], '문창귀인');

  const hongyeomMap = { 갑:'오', 을:'오', 병:'인', 정:'미', 무:'진', 기:'진', 경:'술', 신:'유', 임:'자', 계:'신' };
  if (hongyeomMap[dayGan]) addToJi(hongyeomMap[dayGan], '홍염살');

  const yangInMap = { 갑:'묘', 을:'인', 병:'오', 정:'사', 무:'오', 기:'사', 경:'유', 신:'신', 임:'자', 계:'해' };
  if (yangInMap[dayGan]) addToJi(yangInMap[dayGan], '양인살');

  const baekhoJuList = ['갑진','을미','병술','정축','무진','기축','경진','신미','임술','계축'];
  const dayJu = dayGan + dayJi;
  if (baekhoJuList.includes(dayJu)) result.day.push('백호살');

  const goranList = ['갑인','을사','병신','정해','무신','기해','경인','신사','임신','계해'];
  if (goranList.includes(dayJu)) result.day.push('고란살');

  // 귀문관살
  const gwimunPairs = [['자','유'],['축','오'],['인','미'],['묘','신'],['진','해'],['사','술']];
  const allJis = [yearJi, monthJi, dayJi, hourJi].filter(Boolean);
  gwimunPairs.forEach(([a, b]) => {
    if (allJis.includes(a) && allJis.includes(b)) {
      Object.entries(jis).forEach(([key, ji]) => {
        if (ji === a || ji === b) {
          if (!result[key].includes('귀문관살')) result[key].push('귀문관살');
        }
      });
    }
  });

  // 원진살
  const wonjinPairs = [['자','미'],['축','오'],['인','유'],['묘','신'],['진','해'],['사','술']];
  wonjinPairs.forEach(([a, b]) => {
    if (allJis.includes(a) && allJis.includes(b)) {
      Object.entries(jis).forEach(([key, ji]) => {
        if (ji === a || ji === b) {
          if (!result[key].includes('원진살')) result[key].push('원진살');
        }
      });
    }
  });

  // ==========================================
  // 3. 서브 신살(잡살)
  // ==========================================
  const biinMap = { 갑:'유', 을:'술', 병:'자', 정:'축', 무:'자', 기:'축', 경:'묘', 신:'진', 임:'오', 계:'미' };
  if (biinMap[dayGan]) addToJi(biinMap[dayGan], '비인살');

  const chunbokMap = { 갑:'유', 을:'신', 병:'자', 정:'해', 무:'묘', 기:'인', 경:'오', 신:'사', 임:'오', 계:'사' };
  if (chunbokMap[dayGan]) addToJi(chunbokMap[dayGan], '천복귀인');

  const chunjuMap = { 갑:'사', 을:'오', 병:'자', 정:'사', 무:'오', 기:'신', 경:'해', 신:'자', 임:'인', 계:'묘' };
  if (chunjuMap[dayGan]) addToJi(chunjuMap[dayGan], '천주귀인');

  const gwanggwiMap = { 갑:'유', 을:'해', 병:'자', 정:'인', 무:'묘', 기:'사', 경:'오', 신:'신', 임:'유', 계:'해' };
  if (gwanggwiMap[dayGan]) addToJi(gwanggwiMap[dayGan], '관귀학관');

  const mungokMap = { 갑:'해', 을:'자', 병:'인', 정:'묘', 무:'진', 기:'사', 경:'사', 신:'오', 임:'신', 계:'유' };
  if (mungokMap[dayGan]) addToJi(mungokMap[dayGan], '문곡귀인');

  const boksungMap = { 갑:'인', 을:'축', 병:'자', 정:'유', 무:'신', 기:'미', 경:'오', 신:'사', 임:'진', 계:'묘' };
  if (boksungMap[dayGan]) addToJi(boksungMap[dayGan], '복성귀인');

  // 현침살
  Object.entries(gans).forEach(([key, gan]) => {
    if (['갑', '신'].includes(gan)) {
      if (!result[key].includes('현침살')) result[key].push('현침살');
    }
  });
  Object.entries(jis).forEach(([key, ji]) => {
    if (['묘', '오', '미', '신'].includes(ji)) {
      if (!result[key].includes('현침살')) result[key].push('현침살');
    }
  });

  // ==========================================
  // 4. 💡 중복 완벽 제거 및 깔끔한 정렬 출력
  // ==========================================
  const twelveShenshaNames = ['겁살','재살','천살','지살','년살','월살','망신살','장성살','반안살','역마살','육해살','화개살'];

  Object.keys(result).forEach(key => {
    // 💡 [...new Set(배열)] 공식을 사용하여 배열 내의 모든 중복된 글자를 1개로 압축합니다.
    const uniqueSinsals = [...new Set(result[key])];
    
    // 보기 좋게 12신살을 위로 올리고 나머지를 아래로 내립니다.
    const twelves = uniqueSinsals.filter(s => twelveShenshaNames.includes(s));
    const others = uniqueSinsals.filter(s => !twelveShenshaNames.includes(s));
    
    result[key] = [...twelves, ...others];
  });

  return result;
}