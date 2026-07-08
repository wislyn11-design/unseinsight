import KoreanLunarCalendar from 'korean-lunar-calendar';

export function convertLunarToSolar(year, month, day, isLeapMonth = false) {
  const calendar = new KoreanLunarCalendar();
  
  const isValid = calendar.setLunarDate(year, month, day, isLeapMonth);
  
  if (!isValid) {
    throw new Error('유효하지 않은 음력 날짜입니다.');
  }
  
  // getSolarCalendar()를 통해 양력 날짜가 담긴 객체를 한 번에 가져옵니다.
  const solarDate = calendar.getSolarCalendar();
  
  // 반환된 객체에서 year, month, day 속성을 각각 꺼내서 사용합니다.
  const solarYear = solarDate.year;
  const solarMonth = solarDate.month;
  const solarDay = solarDate.day;
  
  return {
    year: solarYear,
    month: solarMonth,
    day: solarDay,
    formattedDate: `${solarYear}-${String(solarMonth).padStart(2, '0')}-${String(solarDay).padStart(2, '0')}`
  };
}