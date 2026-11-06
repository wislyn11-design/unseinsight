// 표시 전용: 저장된 값을 읽으며 명식·시차·대운을 계산하지 않습니다.
export function formatBirthTime(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  let match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/);
  if (!match) match = raw.match(/^(\d{1,2})시\s*(\d{1,2})분(?:\s*(\d{1,2})초)?$/);
  if (!match && /^\d{3,4}$/.test(raw)) {
    const digits = raw.padStart(4, "0");
    match = [raw, digits.slice(0, 2), digits.slice(2)];
  }
  if (!match) return "";
  const hour = Number(match[1]), minute = Number(match[2]);
  const second = Number(match[3] || 0);
  if (hour > 23 || minute > 59 || second > 59) return "";
  return `${hour}시 ${String(minute).padStart(2, "0")}분`;
}

export function getDayMasterIdentity(chart) {
  const stems = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
  const hanja = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const raw = String(chart?.day?.gan || "").trim();
  const index = stems.includes(raw) ? stems.indexOf(raw) : hanja.indexOf(raw);
  if (index < 0) return null;
  return { stem: stems[index], hanja: hanja[index], element: ["木", "火", "土", "金", "水"][Math.floor(index / 2)] };
}
