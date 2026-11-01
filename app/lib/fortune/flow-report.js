// 실제 사용자 기록만 집계합니다. 운세 점수/AI 추정치를 실적에 포함하지 않습니다.
export function buildFlowReport(plans, reviews) {
  const ordered = [...reviews].sort((a, b) => a.review_date.localeCompare(b.review_date));
  const reviewedTasks = ordered.flatMap((r) => Array.isArray(r.tasks) ? r.tasks : []);
  const completed = reviewedTasks.filter((t) => t.done === true).length;
  const percentage = (rows) => {
    const tasks = rows.flatMap((r) => Array.isArray(r.tasks) ? r.tasks : []);
    return tasks.length ? Math.round(tasks.filter((t) => t.done === true).length / tasks.length * 100) : null;
  };
  const patterns = new Map();
  for (const plan of plans) {
    for (const text of String(plan.plan_text || '').split('\n').map((s) => s.trim()).filter(Boolean)) {
      const key = text.replace(/\s+/g, '').toLocaleLowerCase('ko-KR');
      if (!patterns.has(key)) patterns.set(key, { task: text, dates: new Set(), reviewed: 0, completed: 0 });
      patterns.get(key).dates.add(plan.plan_date);
    }
  }
  for (const r of ordered) {
    const seen = new Set();
    for (const t of Array.isArray(r.tasks) ? r.tasks : []) {
      const key = String(t.text || '').replace(/\s+/g, '').toLocaleLowerCase('ko-KR');
      // 같은 날 중복 입력은 패턴의 날짜 수를 늘리지 않습니다.
      if (!key || seen.has(key)) continue;
      seen.add(key);
      if (!patterns.has(key)) patterns.set(key, { task: t.text, dates: new Set(), reviewed: 0, completed: 0 });
      const item = patterns.get(key);
      item.dates.add(r.review_date);
      item.reviewed++;
      if (t.done === true) item.completed++;
    }
  }
  const repeated = [...patterns.values()].filter((p) => p.dates.size >= 2)
    .map((p) => ({ task: p.task, days: p.dates.size, reviewed: p.reviewed, completed: p.completed }))
    .sort((a, b) => b.days - a.days || a.task.localeCompare(b.task, 'ko')).slice(0, 6);
  const split = Math.floor(ordered.length / 2);
  const before = ordered.slice(0, split), after = ordered.slice(split);
  const beforeRate = percentage(before), afterRate = percentage(after);
  const trend = ordered.length >= 4 && beforeRate !== null && afterRate !== null ? {
    beforeRate, afterRate, difference: afterRate - beforeRate,
    beforeStart: before[0].review_date, beforeEnd: before[before.length - 1].review_date,
    afterStart: after[0].review_date, afterEnd: after[after.length - 1].review_date,
  } : null;
  const dates = [...new Set([...plans.map((p) => p.plan_date), ...ordered.map((r) => r.review_date)])].sort().reverse();
  return {
    planDays: new Set(plans.map((p) => p.plan_date)).size,
    reviewDays: ordered.length,
    taskCount: reviewedTasks.length, completed,
    completionRate: reviewedTasks.length ? Math.round(completed / reviewedTasks.length * 100) : null,
    averageMood: ordered.length ? Math.round(ordered.reduce((n, r) => n + r.mood, 0) / ordered.length * 10) / 10 : null,
    repeated, trend,
    records: dates.map((date) => {
      const plan = plans.find((p) => p.plan_date === date);
      const review = ordered.find((r) => r.review_date === date);
      return { date, planText: plan?.plan_text || '', review: review ? {
        tasks: review.tasks, mood: review.mood, goodText: review.good_text,
        difficultText: review.difficult_text, nextText: review.next_text,
      } : null };
    }),
  };
}
