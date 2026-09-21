import Link from "next/link";
import styles from "./FortunePageIntro.module.css";

export function formatKoreanBirthDate(value) {
  if (!value) return "생년월일 미입력";

  const matched = String(value).trim().match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (!matched) return String(value);

  const [, year, month, day] = matched;
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

export function getCalendarLabel(calendarType, isLeapMonth = false) {
  const normalized = String(calendarType || "solar").trim().toLowerCase();
  const isLunar = ["lunar", "음력", "l"].includes(normalized);

  if (!isLunar) return "양력";
  return isLeapMonth ? "음력·윤달" : "음력";
}

export default function FortunePageIntro({
  serviceTitle,
  description,
  homeHref = "/home",
  profile = null,
  sentence,
  showProfile = true,
}) {
  const {
    name = "사용자",
    birthDate,
    birthTime,
    birthTimeUnknown = false,
    calendarType = "solar",
    isLeapMonth = false,
  } = profile || {};

  const displayName = String(name).endsWith("님") ? String(name) : `${name}님`;
  const dateText = formatKoreanBirthDate(birthDate);
  const calendarText = getCalendarLabel(calendarType, isLeapMonth);
  const timeText = birthTimeUnknown || !birthTime ? "출생 시간 미상" : birthTime;
  const serviceSentence = sentence || `사주로 본 ${serviceTitle}입니다`;

  return (
    <header className={styles.pageIntro}>
      <nav className={styles.breadcrumb} aria-label="현재 위치">
        <Link href={homeHref}>홈</Link>
        <span aria-hidden="true">›</span>
        <strong>{serviceTitle}</strong>
      </nav>

      {showProfile && (profile ? (
        <p className={styles.profileLine}>
          <strong>{displayName}</strong>
          <span aria-hidden="true">·</span>
          <span>{dateText} ({calendarText})</span>
          <span aria-hidden="true">·</span>
          <span>{timeText}</span>
          <span className={styles.serviceSentence}>{serviceSentence}</span>
        </p>
      ) : (
        <p className={`${styles.profileLine} ${styles.profileLoading}`}>
          사주 정보를 불러오고 있습니다.
        </p>
      ))}

      <h1>{serviceTitle}</h1>
      {description ? <p className={styles.description}>{description}</p> : null}
    </header>
  );
}
