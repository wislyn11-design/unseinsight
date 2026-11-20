// 숨긴 메뉴는 목록에서 제거하면 다시 표시됩니다. 기존 페이지·API·저장 데이터는 유지합니다.
const HIDDEN_SERVICE_PATHS: ReadonlySet<string> = new Set([
  "/fortune/health", "/fortune/love", "/fortune/compatibility", "/fortune/tojeong",
  "/fortune/consultation",
]);
const HIDDEN_SECTION_IDS: ReadonlySet<string> = new Set([
  "today-review", "today-report", "wealth-month", "wealth-counsel",
  "children-birth", "children-naming",
]);
export const isFortuneServiceVisible = (path: string): boolean => !HIDDEN_SERVICE_PATHS.has(path.split(/[?#]/)[0]);
export const isFortuneSectionVisible = (id: string): boolean => !HIDDEN_SECTION_IDS.has(id);
