const ohaengMap = {
    갑:'목', 을:'목', 병:'화', 정:'화', 무:'토', 기:'토', 경:'금', 신:'금', 임:'수', 계:'수',
    자:'수', 축:'토', 인:'목', 묘:'목', 진:'토', 사:'화', 오:'화', 미:'토', 신:'금', 유:'금', 술:'토', 해:'수',
  };
  
  export function getOhaengCount(pillars) {
    const count = { 목:0, 화:0, 토:0, 금:0, 수:0 };
    pillars.forEach(({ gan, ji }) => {
      if (gan && ohaengMap[gan]) count[ohaengMap[gan]]++;
      if (ji && ohaengMap[ji]) count[ohaengMap[ji]]++;
    });
    return count;
  }
  
  export function getOhaeng(gan) {
    return ohaengMap[gan] || '';
  }