"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { LoginModal } from "../components/layout/login-modal";
import "./consult.css";
import {VipAccess,IssueInvite} from "./VipAccess";
import Dashboard from "./Dashboard";
import ChatRoom from "./ChatRoom";

const states = {waiting:"대기 중", active:"상담 중", closed:"종료"};
const stamp = value => new Date(value).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});
function rows(result) { if (result.error) throw result.error; return result.data; }
async function api(db,path,body) {
  const {data:{session}}=await db.auth.getSession();
  const res=await fetch("/api/consult/"+path,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session?.access_token},body:JSON.stringify(body)});
  if(!res.ok) throw new Error("알림 서비스 연결을 확인해 주세요.");
}
async function enablePush(db) {
  if(!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("지원 브라우저에서 열어주세요. 아이폰은 홈 화면에 추가한 뒤 열어주세요.");
  const key=process.env.NEXT_PUBLIC_CONSULT_PUSH_KEY;
  if(!key) throw new Error("운영자의 푸시 설정이 필요합니다.");
  if(await Notification.requestPermission()!=="granted") throw new Error("휴대폰 설정에서 알림을 허용해 주세요.");
  const reg=await navigator.serviceWorker.register("/consult/sw.js",{scope:"/consult/"});
  if(!reg.active) await new Promise((resolve,reject)=>{
    const worker=reg.installing || reg.waiting;
    if(!worker) return reject(new Error("알림 등록을 다시 시도해 주세요."));
    worker.addEventListener("statechange",()=>{if(worker.state==="activated")resolve();if(worker.state==="redundant")reject(new Error("알림 등록 실패"));});
  });
  const bytes=Uint8Array.from(atob(key.replace(/-/g,"+").replace(/_/g,"/")),x=>x.charCodeAt(0));
  const sub=await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
  await api(db,"subscribe",sub.toJSON());
}

export default function Consult({view,channel="dosa",roomId,finished,after,embedded=false,visible=true,onRequestComplete,onBack,customerName}) {
  const [db]=useState(createClient);
  const [access,setAccess]=useState(null),[selected,setSelected]=useState(null);
  const [loginOpen,setLoginOpen]=useState(false);
  const [uid,setUid]=useState(undefined),[data,setData]=useState(null),[err,setErr]=useState("");
  const [draft,setDraft]=useState(""),[choice,setChoice]=useState(""),[filter,setFilter]=useState("all");
  const [account,setAccount]=useState(""),[name,setName]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  const draftKey=useRef(null),lock=useRef(false),generation=useRef(0);
  useEffect(()=>{const {data:{subscription}}=db.auth.onAuthStateChange((event,s)=>{
    setUid(s?.user.id??null);
    if(event==="SIGNED_OUT"){navigator.serviceWorker?.getRegistration("/consult/").then(r=>r?.pushManager.getSubscription()).then(s=>s?.unsubscribe()).catch(()=>{});}
  });return ()=>subscription.unsubscribe();},[db]);
  const load=useCallback(async()=>{
    if(!uid)return;
    const ticket=++generation.current;
    try {
      const [a,b]=await Promise.all([db.from("dosa_chat_advisers").select("*").order("display_name").order("user_id"),db.from("consult_admins").select("user_id").eq("user_id",uid)]);
      const advisors=rows(a),admin=rows(b).length>0,adviser=advisors.some(x=>x.user_id===uid&&x.active);
      const counts=admin&&view==="admin"?rows(await db.rpc("consult_counts")):[];
      let request=null,history=[],room=null,list=[],messages=[],target=choice || advisors.find(x=>x.active&&x.user_id!==uid)?.user_id;
      const inboxMode=adviser && view==="me";
      if(inboxMode){
        for(let offset=0;;offset+=200){
          const batch=rows(await db.rpc("consult_visible_history").range(offset,offset+199));
          history.push(...batch);if(batch.length<200)break;
        }
        for(let offset=0;;offset+=200){
          const batch=rows(await db.rpc("consult_inbox").range(offset,offset+199));
          list.push(...batch);if(batch.length<200)break;
        }
      }
      if(view==="customer" && !adviser){
        [request]=rows(await db.rpc("consult_request_status",{p_channel:channel}));
      }
      let returningRoom=null;
      if(view==="customer" && channel==="dosa" && !adviser){
        const activeDosa=advisors.filter(a=>a.active && a.consult_channel==="dosa").map(a=>a.user_id);
        if(activeDosa.length){
          const preferred=request?.status==="active"?[request.adviser_id]:activeDosa;
          returningRoom=rows(await db.from("dosa_chat_rooms").select("*").eq("customer_id",uid)
            .eq("dosa_approved",true).in("adviser_id",preferred).order("updated_at",{ascending:false})
            .order("id").limit(1).maybeSingle());
        }
      }
      const vip=channel==="dosa" && access?.uid===uid && rows(await db.rpc("consult_vip_ok",{p_adviser:access.adviser}));
      const approved=request?.approval_required && request.status==="active" &&
        rows(await db.rpc("consult_vip_ok",{p_adviser:request.adviser_id}));
      const pass=Boolean(returningRoom) || approved || (vip && !request?.approval_required);
      if(returningRoom)target=returningRoom.adviser_id;
      else if(approved)target=request.adviser_id;
      else if(pass)target=access.adviser;
      if(view==="room"){
        const id=roomId || new URLSearchParams(location.search).get("id");
        room=rows(await db.from("dosa_chat_rooms").select("*").eq("id",id).maybeSingle());
        if(!room)throw new Error("접근할 수 없는 상담방입니다.");
        target=room.adviser_id;
      }else if(view==="customer" && pass && !adviser){
        room=returningRoom || rows(await db.from("dosa_chat_rooms").select("*").eq("adviser_id",target).eq("customer_id",uid).maybeSingle());
      }
      if(room && (finished || room.status!=="closed")){
        const lowerBound=finished ? after : room.last_session_end;
        for(let offset=0;;offset+=200){
          let query=db.from("dosa_chat_messages").select("*").eq("room_id",room.id);
          if(finished)query=query.lte("sent_at",finished);
          if(lowerBound)query=query.gt("sent_at",lowerBound);
          const batch=rows(await query.order("sent_at").order("sender_id").order("client_message_id").range(offset,offset+199));
          messages.push(...batch);if(batch.length<200)break;
        }
      }
      if(finished && room)room={...room,status:"closed"};
      if(ticket===generation.current){setData({uid,advisors,admin,adviser,room,list,history,messages,target,counts,pass,inboxMode,request});setErr("");}
    }catch(e){if(ticket===generation.current){setErr(e.message);setData(null);}}
  },[db,uid,choice,view,access,roomId,channel,finished,after]);
  useEffect(()=>{setDraft("");draftKey.current=null;setData(null);},[load]);
  useEffect(()=>{if(!visible)return;let live=true,timer;
    async function tick(){await load();if(live && !finished)timer=setTimeout(tick,4000);}
    tick();return()=>{live=false;clearTimeout(timer);generation.current++;};
  },[load,visible,finished]);
  async function act(fn){
    if(lock.current)return;lock.current=true;setBusy(true);setNotice("");
    try{await fn();await load();}catch(e){setNotice(e.message || "다시 시도해 주세요.");}
    finally{lock.current=false;setBusy(false);}
  }
  const d=data?.uid===uid?data:null,room=d?.room,staff=room?.adviser_id===uid;
  const lastIncoming=staff && !finished?d?.messages.findLast(m=>m.sender_id!==uid)?.client_message_id:null;
  useEffect(()=>{
    if(!lastIncoming||!visible||!room?.id)return;
    function seen(){if(document.visibilityState==="visible")db.rpc("consult_seen",{p_room:room.id,p_message:lastIncoming}).then(()=>{});}
    seen(); document.addEventListener("visibilitychange",seen);return ()=>document.removeEventListener("visibilitychange",seen);
  },[db,room?.id,lastIncoming,visible]);
  function send(e){
    e.preventDefault();if(!draft.trim())return;
    act(async()=>{
      const key=draftKey.current??=crypto.randomUUID();
      if(staff)rows(await db.rpc("consult_handle",{p_room:room.id,p_action:"reply",p_client_id:key,p_body:draft}));
      else{
        const id=rows(await db.rpc("consult_send",{p_adviser:d.target,p_client_id:key,p_body:draft}));
        // The durable queue also handles notification requests interrupted by navigation.
        if(!room?.dosa_approved && room?.status!=="active")api(db,"notify",{room:id}).catch(()=>{});
      }
      setDraft("");draftKey.current=null;
    });
  }
  const handle=action=>act(async()=>rows(await db.rpc("consult_handle",{p_room:room.id,p_action:action})));
  const adminChange=(id,label,active)=>act(async()=>{
    rows(await db.rpc("consult_set_adviser",{p_user:id,p_name:label,p_active:active}));setAccount("");setName("");
  });
  const requestLock=useRef(false);
  const [requestFeedback,setRequestFeedback]=useState(null);
  const feedback=requestFeedback?.uid===uid ? requestFeedback : null;
  const submitRequest=useCallback(async()=>{
    if(!uid||requestLock.current)return;
    requestLock.current=true;
    setRequestFeedback({uid,status:"sending"});
    try{
      const id=rows(await db.rpc("consult_request",{p_channel:channel}));
      if(!id)throw new Error("신청 접수 결과를 확인할 수 없습니다. 다시 시도해 주세요.");
      setRequestFeedback({uid,status:"success"});
      api(db,"notify",{room:id}).catch(()=>{});
      await load();
    }catch(error){
      setRequestFeedback({uid,status:"error",message:error.message||"상담 신청에 실패했습니다. 다시 시도해 주세요."});
    }finally{
      requestLock.current=false;
    }
  },[db,uid,channel,load]);
  useEffect(()=>{
    if(feedback?.status!=="success")return;
    if(d?.pass){setRequestFeedback(null);return;}
    const timer=setTimeout(()=>{
      setRequestFeedback(null);
      if(embedded && channel==="dosa")onRequestComplete?.();
    },3000);
    return ()=>clearTimeout(timer);
  },[feedback,d?.pass,embedded,channel,onRequestComplete]);
  const inbox=view==="me"||d?.inboxMode,adminView=view==="admin";
  if(uid && d && view==="me" && d.adviser)return <Dashboard RoomComponent={Consult} key={uid} data={d} db={db} busy={busy} notice={notice} act={act} enablePush={enablePush}/>;
  if(uid && d && view==="customer" && d.adviser)return <section className="vipGate"><Link href="/consult/me">상담 관리 열기</Link></section>;
  if(view==="customer" && channel==="dosa" && !d?.pass && feedback?.status==="success"){
    return <section className="vipGate"><p role="status">상담신청이 접수되었습니다</p></section>;
  }
  if(view==="customer" && uid && d && !d.adviser && !d.pass){
    return <section className="vipGate">
      <h2>{channel==="general"?"일반 상담":d.request?.status==="active"?"도사님 상담":"도사님 상담신청"}</h2>
      {feedback?.status==="success"&&<p role="status">상담신청이 접수되었습니다</p>}
      {d.request?.status==="waiting" ? <p role="status">승인 대기 중입니다.</p> : d.request?.status==="active" ? <p role="status">상담방 입장을 확인하고 있습니다.</p> : feedback?.status==="success" ? null :
        <button type="button" disabled={busy||feedback?.status==="sending"} onClick={submitRequest}>
          {feedback?.status==="sending"?"신청 중…":channel==="dosa"?"상담신청":"상담 신청"}
        </button>}
      {(notice||feedback?.status==="error")&&<p role="alert">{notice||feedback?.message}</p>}
      {channel==="dosa"&&!d.request?.approval_required&&<details>
        <summary>VIP 초대 비밀번호로 입장</summary>
        <VipAccess key={uid} uid={uid} db={db} onUnlock={adviser=>setAccess({uid,adviser})}/>
      </details>}
    </section>;
  }
  if(uid && d && !inbox && !adminView && !(view==="customer" && d.adviser)){
    return <ChatRoom archive={Boolean(finished)} onBack={onBack} customerName={customerName} embedded={embedded} key={d.target} data={d} uid={uid} staff={staff} busy={busy} notice={notice} draft={draft}
      changeDraft={value=>{setDraft(value);draftKey.current=null;}} send={send} handle={handle}
      choose={setChoice} canChoose={false}/>;
  }
  return <main className="consultShell"><article className="consultPanel">
    <nav><Link href="/home">운세인사이트</Link><Link href="/consult/me">마이페이지</Link></nav>
    <h1>{adminView?"운영자 관리":inbox?"마이페이지":staff?"고객 상담":"도사님 상담"}</h1>
    {notice && <p role="status">{notice}</p>}
    {uid===undefined?<p>불러오는 중…</p>:!uid?<><p>상담을 이용하려면 로그인해 주세요.</p><button onClick={()=>{if(embedded)sessionStorage.setItem("consult-return",location.pathname);setLoginOpen(true);}}>로그인하고 상담하기</button><LoginModal open={loginOpen} onClose={()=>setLoginOpen(false)} nextPath={typeof window==="undefined"?"/consult":window.location.pathname+window.location.search}/></>:!d?<p>{err || "불러오는 중…"}</p>:adminView?
    (d.admin?<><h2>상담 현황</h2><div className="consultTotals">{Object.entries(states).map(([key,label])=><div key={key}>{label}<strong>{d.counts.find(c=>c.status===key)?.total??0}건</strong></div>)}</div><h2>도사님 계정 관리</h2><form onSubmit={e=>{e.preventDefault();adminChange(account.trim(),name,true);}}>
    <label>회원 UID<input required value={account} onChange={e=>setAccount(e.target.value)} placeholder="회원 계정 UUID"/></label>
    <label>표시 이름<input maxLength={40} required value={name} onChange={e=>setName(e.target.value)} /></label><button disabled={busy}>도사님 지정</button></form>
    {d.advisors.map(a=><div className="consultRow" key={a.user_id}><div><strong>{a.display_name}</strong><small>{a.user_id}</small></div>
    <button disabled={busy} onClick={()=>adminChange(a.user_id,a.display_name,!a.active)}>{a.active?"권한 해제":"다시 지정"}</button></div>)}</>:<p>운영자 전용 페이지입니다.</p>):
    <p>등록된 도사님만 사용할 수 있습니다. <Link href="/home">사이트로 돌아가기</Link></p>}
  </article></main>;
}
