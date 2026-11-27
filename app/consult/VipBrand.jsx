"use client";
import Link from "next/link";
import {useCallback,useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {createClient} from "../lib/supabase/client";
import Consult from "./Consult";
import MessengerWindow from "./MessengerWindow";
export default function VipBrand(){
  const [mode,setMode]=useState("closed"),trigger=useRef(null);
  const [userId,setUserId]=useState(null);
  useEffect(()=>{
    const db=createClient();
    const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{
      setUserId(session?.user.id??null);
      if(!session)setMode("closed");
    });
    return ()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{
    if(sessionStorage.getItem("consult-return")!==location.pathname)return;
    let live=true;
    async function resume(){
      const db=createClient();
      const {data:{user}}=await db.auth.getUser();
      if(!live||!user)return;
      const {data,error}=await db.from("dosa_chat_advisers").select("user_id").eq("user_id",user.id).eq("active",true).maybeSingle();
      if(!live)return;
      sessionStorage.removeItem("consult-return");
      if(!error&&!data)setMode("open");
    }
    resume();
    return ()=>{live=false;};
  },[]);
  const close=useCallback(()=>{setMode("closed");trigger.current?.focus();},[]);
  return <><div className="relative flex min-h-[44px] w-[192px] shrink-0 items-center sm:w-[216px]">
    <img src="/brand/unseinsight-logo.svg" width={864} height={184} alt="" className="block h-auto w-full"/>
    <div className="absolute inset-0 flex"><button ref={trigger} disabled={!userId} type="button" aria-label="도사님 VIP 상담 열기" aria-expanded={mode==="open"} title="도사님 VIP 상담" className="min-w-[44px] w-[21%]" onClick={()=>setMode("open")}/>
    <Link href="/home" aria-label="운세인사이트 메인으로" className="flex-1"/></div></div>
    <Link href="/consult/general" className="fixed bottom-28 left-4 z-30 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-800 shadow ring-1 ring-indigo-200 lg:bottom-6">일반 상담 신청</Link>
    {userId && mode!=="closed" && <MessengerWindow key={userId} title="운세인사이트 · 상담 메신저"
      minimized={mode==="min"} onMinimize={()=>setMode("min")} onClose={close}>
      <Consult view="customer" embedded onRequestComplete={close} visible={mode==="open"}/>
    </MessengerWindow>}
    {userId && mode==="min" && createPortal(
      <button type="button" className="vipRestore" onClick={()=>setMode("open")}>도사님 상담 열기</button>,document.body)}
  </>;
}
