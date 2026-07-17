export function generateSajuPrompt(saju) {
  // 1. 사주 원국 정보 추출
  const year = saju?.year?.gan ? `${saju.year.gan}${saju.year.ji}` : '미제공';
  const month = saju?.month?.gan ? `${saju.month.gan}${saju.month.ji}` : '미제공';
  const day = saju?.day?.gan ? `${saju.day.gan}${saju.day.ji}` : '미제공';
  const hour = saju?.hour?.gan ? `${saju.hour.gan}${saju.hour.ji}` : '미제공';

  const gender = saju?.gender || '고객';
  
  // 💡 [핵심 수정 포인트] 현재 연도와 월을 컴퓨터 시간 기준으로 실시간 계산합니다!
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 자바스크립트는 0월부터 시작하므로 +1을 해줍니다.

  const birthYear = saju?.solarDate ? parseInt(saju.solarDate.split('-')[0], 10) : currentYear;
  const currentAge = currentYear - birthYear + 1; 

  // 전체 대운 데이터
  const daeunData = saju?.daeun ? JSON.stringify(saju.daeun) : '데이터 없음';

  return `
[시스템 가이드: 운세인사이트]
1. 본 분석은 '운세인사이트'의 정밀한 로직으로 산출된 데이터를 바탕으로 합니다.
2. 제공된 사주 정보는 검증된 값이므로 다시 계산하지 말고, 이 데이터를 절대적 기준으로 해석하십시오.
3. 답변 시작 시 '운세인사이트' 앱의 데이터를 바탕으로 해석함을 가볍게 언급하며, 명리학 전문가의 품격에 맞는 따뜻한 존댓말로 답변해 주십시오.

[사주 및 운세 정보]
- 성별 : ${gender}
- 출생 연도 : ${birthYear}년
- 현재 나이 : ${currentAge}세
- 사주팔자 : 년주(${year}), 월주(${month}), 일주(${day}), 시주(${hour})
- 대운 정보 : ${daeunData}
(※ 중요 지시사항: 사용자의 현재 나이를 기준으로 대운, 세운(${currentYear}년), 월운(${currentMonth}월)의 흐름을 통합적으로 분석하십시오.)

[출력 구조 및 작성 가이드]
- 프론트엔드 UI 화면 출력을 위해 반드시 아래 5개 항목의 제목 앞에 '### ' 기호를 붙여주십시오.
- 각 섹션의 핵심 문장은 **Bold** 처리를 하여 강조해 주십시오.
- 가독성을 위해 내용이 전환될 때 단락을 자주 나누고, 항목이나 조언을 나열할 때는 **반드시 줄바꿈(Enter)**을 하여 시각적으로 읽기 편하게 작성해 주십시오.

[도입부: 💫 사주 총평]
- 사주 원국(태어난 연/월/일/시 8글자)과 오행의 분포를 바탕으로 이 사람이 타고난 전반적인 기질, 성향, 그리고 삶의 큰 테마를 2~3문단으로 깊이 있게 총평해 주세요.

### 1. 현재 대운의 큰 흐름
현재 대운의 간지와 십성 정보를 바탕으로, 이 시기가 사주 원국에 가져오는 전반적인 환경 변화와 10년 단위의 큰 흐름을 분석해 주십시오.

### 2. ${currentYear}년, 올해의 세운(歲運)
${currentYear}년의 기운이 사용자의 사주와 어떻게 상호작용하는지, 올해 가장 주목해야 할 **사회적 성취와 변화**를 구체적으로 분석해 주십시오.

### 3. ${currentMonth}월, 이달의 월운(月運)
${currentMonth}월의 기운이 가져오는 **개인적인 삶의 영역(직업, 재물, 대인관계, 건강 등)**에서의 변화를 구체적으로 분석해 주십시오.

### 4. 시기별 핵심 조언
대운, 세운, 월운의 흐름을 종합하여, 지금 이 시기에 반드시 잡아야 할 기회와 특별히 주의해야 할 점을 **명리학 전문가의 관점**에서 조언해 주십시오.

### 5. 현실적인 실천 지침
현재의 운세 흐름을 활용하여, 일상에서 바로 실천할 수 있는 **마음가짐과 행동 지침**을 현실적으로 제시해 주십시오.
`;
}