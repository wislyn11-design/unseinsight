import {backend,caller,validSubscription} from "../push";
export const runtime="nodejs";
export async function POST(request){
  const db=backend(),user=await caller(db,request);
  if(!user)return new Response(null,{status:401});
  const {data}=await db.from("dosa_chat_advisers").select("active").eq("user_id",user.id).maybeSingle();
  if(!data?.active)return new Response(null,{status:403});
  const sub=await request.json();
  if(!validSubscription(sub))return new Response(null,{status:400});
  const {error}=await db.from("consult_push_devices").upsert({endpoint:sub.endpoint,subscription:sub,user_id:user.id});
  return new Response(null,{status:error?500:204});
}
