import "server-only";
import { createClient } from "@supabase/supabase-js";
const webpush = require("web-push");


export function backend(){
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function caller(db,request){
  const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if(!token)return null;
  const {data,error}=await db.auth.getUser(token);
  return error?null:data.user;
}
export function validSubscription(sub){
  try{
    const u=new URL(sub.endpoint),h=u.hostname;
    const allowed=["fcm.googleapis.com","push.services.mozilla.com","push.apple.com","notify.windows.com"];
    return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&
      allowed.some(domain=>h===domain||h.endsWith("."+domain))&&
      /^[A-Za-z0-9_-]{87}=?$/.test(sub.keys.p256dh)&&/^[A-Za-z0-9_-]{22}(==)?$/.test(sub.keys.auth);
  }catch{return false;}
}
function result(r){if(r.error)throw r.error;return r.data;}
export async function dispatch(db,roomId){
  webpush.setVapidDetails(process.env.CONSULT_PUSH_CONTACT,process.env.NEXT_PUBLIC_CONSULT_PUSH_KEY,process.env.CONSULT_PUSH_PRIVATE_KEY);
  const stale=new Date(Date.now()-180000).toISOString();
  const available="claimed_at.is.null,claimed_at.lt."+stale;
  let query=db.from("consult_alerts").select("*").is("completed_at",null).or(available).order("created_at").limit(10);
  if(roomId)query=query.eq("room_id",roomId);
  for(const item of result(await query)){
    const claim=new Date().toISOString();
    const held=result(await db.from("consult_alerts").update({claimed_at:claim}).eq("id",item.id).is("completed_at",null).or(available).select("id"));
    if(!held.length)continue;
    const adviser=result(await db.from("dosa_chat_advisers").select("active").eq("user_id",item.adviser_id).single());
    const room=result(await db.from("dosa_chat_rooms").select("status").eq("id",item.room_id).single());
    const devices=adviser.active&&room.status==="waiting"?result(await db.from("consult_push_devices").select("subscription").eq("user_id",item.adviser_id)):[];
    let retry=false;
    for(const {subscription} of devices){
      try{
        if(!validSubscription(subscription))continue;
        await webpush.sendNotification(subscription,JSON.stringify({room:item.room_id}),{TTL:3600,timeout:6000});
      }catch(e){
        if([404,410].includes(e.statusCode))result(await db.from("consult_push_devices").delete().eq("endpoint",subscription.endpoint));
        else retry=true;
      }
    }
    if(!retry)result(await db.from("consult_alerts").update({completed_at:new Date().toISOString()}).eq("id",item.id).eq("claimed_at",claim));
  }
}
