"use client";
import Link from "next/link";
import {useState,useEffect} from "react";
import {createClient} from "../lib/supabase/client";

export default function StaffLinks(){
  const [db]=useState(createClient), [uid,setUid]=useState(null), [roles,setRoles]=useState(null);
  useEffect(()=>{
    const {data}=db.auth.onAuthStateChange((_,session)=>setUid(session?.user.id??null));
    return ()=>data.subscription.unsubscribe();
  },[db]);
  useEffect(()=>{
    if(!uid)return;
    let live=true;
    async function refresh(){
      const [a,b]=await Promise.all([db.from("dosa_chat_advisers").select("user_id").eq("user_id",uid).eq("active",true).maybeSingle(),db.from("consult_admins").select("user_id").eq("user_id",uid).maybeSingle()]);
      if(live)setRoles({uid,adviser:!!a.data,admin:!!b.data});
    }
    refresh(); window.addEventListener("focus",refresh);
    return ()=>{live=false;window.removeEventListener("focus",refresh);};
  },[db,uid]);
  if(!uid||roles?.uid!==uid||!(roles.adviser||roles.admin))return null;
  const buttonClass="inline-flex items-center whitespace-nowrap rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-100";
  return <div className="flex shrink-0 items-center gap-1.5">
    {roles.adviser&&<Link className={buttonClass} prefetch={false} href="/consult/me">상담 관리</Link>}
    {roles.admin&&<Link className={buttonClass} prefetch={false} href="/admin/consult">운영 관리</Link>}
  </div>;
}
