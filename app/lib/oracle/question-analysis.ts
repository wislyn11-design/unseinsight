import { createHash } from "node:crypto";

export const QUESTION_CLASSIFIER_VERSION = "oracle-question-v2";
export const SIMILAR_QUESTION_THRESHOLD = 0.7;

type KeywordRule = Readonly<{
  name: string;
  keywords: readonly string[];
}>;

const TOPIC_RULES: readonly KeywordRule[] = [
  { name: "work", keywords: ["회사", "직장", "업무", "프로젝트", "코딩", "개발", "취업", "이직", "승진", "면접", "계약", "사업", "창업"] },
  { name: "money", keywords: ["돈", "재물", "수입", "지출", "투자", "주식", "대출", "매출", "월급", "재정"] },
  { name: "love", keywords: ["연애", "사랑", "남자친구", "여자친구", "남친", "여친", "썸", "결혼", "재회", "배우자"] },
  { name: "relationship", keywords: ["관계", "친구", "동료", "상대", "인연", "사람", "화해", "갈등"] },
  { name: "family", keywords: ["가족", "부모", "아버지", "어머니", "자녀", "아이", "형제", "자매"] },
  { name: "study", keywords: ["시험", "공부", "합격", "학교", "대학", "자격증", "성적", "과제"] },
  { name: "health", keywords: ["건강", "병원", "치료", "수술", "통증", "회복", "질병", "몸"] },
  { name: "move", keywords: ["이사", "이동", "여행", "유학", "출국", "귀국", "전근"] },
  { name: "legal", keywords: ["법률", "소송", "고소", "분쟁", "합의", "변호사"] },
] as const;

const INTENT_RULES: readonly KeywordRule[] = [
  { name: "possibility", keywords: ["가능", "할 수", "될까", "될까요", "성공", "합격", "이룰"] },
  { name: "choice", keywords: ["선택", "어느", "해야", "그만", "계속", "옮길", "결정"] },
  { name: "timing", keywords: ["언제", "오늘", "이번", "시기", "때", "얼마나"] },
  { name: "relationship", keywords: ["마음", "관계", "연락", "재회", "결혼", "화해"] },
  { name: "outcome", keywords: ["결과", "어떻게 될", "전망", "미래", "흐름"] },
  { name: "solution", keywords: ["방법", "어떻게 해야", "해결", "극복", "대처"] },
] as const;

export type QuestionAnalysis = Readonly<{
  normalized: string;
  fingerprint: string;
  topic: string;
  intent: string;
}>;

export function normalizeOracleQuestion(question: string) {
  return question
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function classify(normalized: string, rules: readonly KeywordRule[], fallback: string) {
  let best = fallback;
  let bestScore = 0;

  for (const rule of rules) {
    const score = rule.keywords.reduce(
      (total, keyword) => total + (normalized.includes(keyword) ? Math.max(1, keyword.length - 1) : 0),
      0,
    );
    if (score > bestScore) {
      best = rule.name;
      bestScore = score;
    }
  }

  return best;
}

export function analyzeOracleQuestion(question: string): QuestionAnalysis {
  const normalized = normalizeOracleQuestion(question);
  return {
    normalized,
    fingerprint: createHash("sha256").update(normalized).digest("hex"),
    topic: classify(normalized, TOPIC_RULES, "other"),
    intent: classify(normalized, INTENT_RULES, "general"),
  };
}

function bigrams(value: string) {
  const compact = value.replace(/\s+/g, "");
  if (compact.length < 2) return compact ? [compact] : [];
  return Array.from({ length: compact.length - 1 }, (_, index) => compact.slice(index, index + 2));
}

function diceCoefficient(left: string, right: string) {
  const leftPairs = bigrams(left);
  const rightPairs = bigrams(right);
  if (!leftPairs.length || !rightPairs.length) return left === right ? 1 : 0;

  const rightCounts = new Map<string, number>();
  for (const pair of rightPairs) rightCounts.set(pair, (rightCounts.get(pair) ?? 0) + 1);

  let matches = 0;
  for (const pair of leftPairs) {
    const count = rightCounts.get(pair) ?? 0;
    if (count > 0) {
      matches += 1;
      rightCounts.set(pair, count - 1);
    }
  }

  return (2 * matches) / (leftPairs.length + rightPairs.length);
}

function tokenJaccard(left: string, right: string) {
  const leftTokens = new Set(left.split(" ").filter((token) => token.length > 1));
  const rightTokens = new Set(right.split(" ").filter((token) => token.length > 1));
  if (!leftTokens.size || !rightTokens.size) return 0;

  let intersection = 0;
  for (const token of leftTokens) if (rightTokens.has(token)) intersection += 1;
  return intersection / new Set([...leftTokens, ...rightTokens]).size;
}

const GENERIC_QUESTION_TOKENS = new Set([
  "오늘", "내일", "이번", "요즘", "정말", "혹시", "과연", "그냥", "조금", "많이",
  "있", "없", "되", "하", "수", "것", "거", "일", "때", "저", "제", "나", "내",
]);

function semanticToken(token: string) {
  const withoutEnding = token
    .replace(/(있을까요|없을까요|될까요|할까요|인가요|일까요|싶어요|좋겠어요|바랄까요|궁금해요)$/u, "")
    .replace(/(습니까|나요|가요|까요|어요|아요|네요|겠죠|겠어요|입니다)$/u, "")
    .replace(/(으로|에서|에게|한테|처럼|보다|까지|부터|하고|이며|이나|은|는|이|가|을|를|에|와|과|도|만)$/u, "")
    .trim();
  return GENERIC_QUESTION_TOKENS.has(withoutEnding) ? "" : withoutEnding;
}

function semanticTokens(value: string) {
  return new Set(value.split(" ").map(semanticToken).filter(Boolean));
}

function anchorContainment(left: string, right: string) {
  const leftTokens = semanticTokens(left);
  const rightTokens = semanticTokens(right);
  if (!leftTokens.size || !rightTokens.size) return { score: 0, matches: 0 };

  let matches = 0;
  for (const token of leftTokens) if (rightTokens.has(token)) matches += 1;
  return {
    score: matches / Math.min(leftTokens.size, rightTokens.size),
    matches,
  };
}

export function oracleQuestionSimilarity(
  current: Pick<QuestionAnalysis, "normalized" | "topic" | "intent">,
  previous: Pick<QuestionAnalysis, "normalized" | "topic" | "intent">,
) {
  if (current.normalized === previous.normalized) return 1;

  const anchor = anchorContainment(current.normalized, previous.normalized);
  const anchorScore = anchor.matches >= 2 && anchor.score >= 0.5
    ? 0.72
    : anchor.matches === 1 && anchor.score === 1
      ? 0.6
      : 0;
  const textScore = Math.max(
    diceCoefficient(current.normalized, previous.normalized),
    tokenJaccard(current.normalized, previous.normalized),
    anchorScore,
  );
  // 한국어는 조사와 종결어미가 바뀌면 같은 핵심어도 문자 점수가 낮아질 수 있어
  // 텍스트가 어느 정도 겹치는 경우 주제와 질문 의도를 보정값으로 사용합니다.
  const hasMeaningfulTextOverlap = textScore >= 0.3;
  const contextBonus = hasMeaningfulTextOverlap
    ? (current.topic === previous.topic && current.topic !== "other" ? 0.16 : 0)
      + (current.intent === previous.intent && current.intent !== "general" ? 0.1 : 0)
    : 0;

  return Math.min(1, Number((textScore + contextBonus).toFixed(4)));
}
