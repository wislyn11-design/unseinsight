import {backend,caller,dispatch} from "../push";
export const runtime="nodejs";
export async function POST(request){
  const db=backend(), user=await caller(db,request);
  if(!user)return new Response(null,{status:401});
  const {room}=await request.json();
  const {data}=await db.from("dosa_chat_rooms").select("id").eq("id",room).eq("customer_id",user.id).maybeSingle();
  if(!data)return new Response(null,{status:403});
  await dispatch(db,data.id);
  return new Response(null,{status:204});
}
export async function GET(request){
  const secret=process.env.CRON_SECRET;
  if(!secret||request.headers.get("authorization")!=="Bearer "+secret)return new Response(null,{status:403});
  await dispatch(backend());
  return new Response(null,{status:204});
}
