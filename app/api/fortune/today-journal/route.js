import { createClient } from '@/app/lib/supabase/server';
import { buildFlowReport } from '../../../lib/fortune/flow-report';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}
function today() {
  return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}
async function authorized(chartId) {
  const db = await createClient();
  const {data: {user}, error: authError} = await db.auth.getUser();
  if (authError || !user) return {response: Response.json({error:'로그인이 필요합니다.'}, {status:401})};
  const {data: chart, error} = await db.from('saju_charts').select('id').eq('id',chartId).eq('user_id',user.id).maybeSingle();
  if (error) throw error;
  if (!chart) return {response: Response.json({error:'본인의 만세력 정보를 찾을 수 없습니다.'}, {status:403})};
  return {db,user};
}
function failure(error) {
  console.error('하루 기록 처리 오류:',error);
  return Response.json({error: error?.code === '42P01' || error?.code === 'PGRST205'
    ? '하루 기록 저장 테이블이 준비되지 않았습니다. 추가 SQL을 적용해 주세요.'
    : '하루 기록을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'}, {status:500});
}
export async function GET(request) {
  try {
    const url = new URL(request.url), chartId = url.searchParams.get('chartId'), date = url.searchParams.get('date');
    if (!UUID.test(chartId || '') || !validDate(date) || date > today()) return Response.json({error:'만세력과 날짜를 확인해 주세요.'},{status:400});
    const auth = await authorized(chartId); if(auth.response) return auth.response;
    const {db,user} = auth;
    if(url.searchParams.get('mode') === 'report') {
      const days = Number(url.searchParams.get('days') || 30);
      if(![7,30].includes(days)) return Response.json({error:'조회 기간을 확인해 주세요.'},{status:400});
      const start = new Date(date+'T00:00:00Z'); start.setUTCDate(start.getUTCDate()-days+1);
      const from = start.toISOString().slice(0,10);
      const [plans,reviews] = await Promise.all([
        db.from('daily_plans').select('plan_date,plan_text').eq('user_id',user.id).eq('chart_id',chartId).gte('plan_date',from).lte('plan_date',date).order('plan_date',{ascending:false}),
        db.from('daily_reviews').select('review_date,tasks,mood,good_text,difficult_text,next_text').eq('user_id',user.id).eq('chart_id',chartId).gte('review_date',from).lte('review_date',date).order('review_date',{ascending:false}),
      ]);
      if(plans.error) throw plans.error; if(reviews.error) throw reviews.error;
      return Response.json({success:true,from,to:date,days,...buildFlowReport(plans.data || [],reviews.data || [])});
    }
    const [plan,review] = await Promise.all([
      db.from('daily_plans').select('plan_text').eq('user_id',user.id).eq('chart_id',chartId).eq('plan_date',date).maybeSingle(),
      db.from('daily_reviews').select('tasks,mood,good_text,difficult_text,next_text,updated_at').eq('user_id',user.id).eq('chart_id',chartId).eq('review_date',date).maybeSingle(),
    ]);
    if(plan.error) throw plan.error; if(review.error) throw review.error;
    return Response.json({success:true,planText:plan.data?.plan_text || '',review:review.data});
  } catch(error) { return failure(error); }
}
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({error:'입력 내용을 확인해 주세요.'},{status:400}); }
  const {chartId,date,mood,tasks,goodText='',difficultText='',nextText=''} = body || {};
  if (!UUID.test(chartId || '') || !validDate(date) || date > today() || !Number.isInteger(mood) || mood<1 || mood>5 ||
      !Array.isArray(tasks) || tasks.length>10 || tasks.some(t=>!t || typeof t.text !== 'string' || !t.text.trim() || t.text.length>2000 || typeof t.done !== 'boolean') ||
      [goodText,difficultText,nextText].some(t=>typeof t !== 'string' || t.length>1000)) {
    return Response.json({error:'날짜, 완료한 일, 만족도와 입력 길이를 확인해 주세요.'},{status:400});
  }
  try {
    const auth = await authorized(chartId); if(auth.response) return auth.response;
    const {db,user} = auth;
    // 계획의 스냅샷을 함께 저장하므로 나중에 계획이 바뀌어도 과거 완료율은 유지됩니다.
    const {error} = await db.from('daily_reviews').upsert({user_id:user.id,chart_id:chartId,review_date:date,
      tasks:tasks.map(t=>({text:t.text.trim(),done:t.done})),mood,good_text:goodText.trim(),difficult_text:difficultText.trim(),next_text:nextText.trim(),updated_at:new Date().toISOString()},
      {onConflict:'user_id,chart_id,review_date'});
    if(error) throw error;
    return Response.json({success:true});
  } catch(error) { return failure(error); }
}
