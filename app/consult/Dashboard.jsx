"use client";
import Link from "next/link";
import {useRef,useState} from "react";
import MessengerWindow from "./MessengerWindow";
import {IssueInvite} from "./VipAccess";
import "./dashboard.css";

const date=new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});
const day=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"});
export default function Dashboard({data,db,busy,notice,act,enablePush,RoomComponent}){
  const [tab,setTab]=useState("상담 홈");
  const [selection,setSelection]=useState(null);
  const trigger=useRef(null);
  const currentRoom=selection?.finished ? selection :
    data.list.find(room=>room.id===selection?.id && room.status==="active");
  function openMessenger(event,room){
    trigger.current=event.currentTarget;
    setSelection(room);
  }
  function closeMessenger(){
    setSelection(null);
    trigger.current?.focus();
  }
  const waiting=data.list.filter(r=>r.status==="waiting").reverse();
  const active=data.list.filter(r=>r.status==="active");
  const today=day.format(new Date());
  const totals=[waiting.length,active.length,data.history.filter(r=>day.format(new Date(r.finished))===today).length];
  const adviser=data.advisors.find(a=>a.user_id===data.uid);
  function approve(room){
    act(async()=>{
      const {error}=await db.rpc("consult_handle",{p_room:room.id,p_action:"start"});
      if(error)throw error;
      setTab("상담 홈");
    });
  }
  function removeRoom(room){
    if(!window.confirm(room.customer_name+" 고객의 상담을 종료하고 목록에서 삭제할까요?"))return;
    act(async()=>{
      const {error}=await db.rpc("consult_remove_request",{p_room:room.id});
      if(error)throw error;
    });
  }
  function removeHistory(room){
    if(!window.confirm(room.customer_name+" 고객의 "+date.format(new Date(room.finished))+" 상담을 완료 목록에서 삭제할까요?"))return;
    act(async()=>{
      const {error}=await db.rpc("consult_hide_completion",{p_room:room.id,p_finished:room.finished});
      if(error)throw error;
      setSelection(current=>current?.id===room.id && current.finished===room.finished ? null : current);
    });
  }
  function panel(title,items,kind){
    const history=kind==="history",start=kind==="waiting";
    return <section className="deskPanel"><header><h2>{title}</h2>{history&&tab==="상담 홈"&&<button onClick={()=>setTab("상담 내역")}>전체 보기</button>}</header>
      {items.length?<table><thead><tr><th>{history?"완료 시각":"최근 활동"}</th><th>신청자</th><th>{history?"상담 방식":"최근 메시지"}</th><th aria-label="상담방"/></tr></thead>
      <tbody>{items.map(r=><tr key={r.id+(r.finished??"")}><td>{date.format(new Date(r.finished??r.updated_at))}</td><td>{r.customer_name}</td><td>{history?"채팅":r.preview}</td>{history?<td><button type="button" onClick={e=>openMessenger(e,r)}>대화 보기</button>{" "}<button type="button" disabled={busy} onClick={()=>removeHistory(r)}>삭제</button></td>:<td>{start ? <button type="button" className="primary" disabled={busy} onClick={()=>approve(r)}>승인</button> :
      <button type="button" onClick={e=>openMessenger(e,r)}>상담하기</button>}{" "}<button type="button" disabled={busy} onClick={()=>removeRoom(r)}>삭제</button></td>}</tr>)}</tbody></table>:<p>{title}이 없습니다.</p>}</section>;
  }
  return <main className="adviserDesk"><aside><Link href="/home"><img src="/brand/unseinsight-logo.svg" alt="운세인사이트"/></Link><small>{adviser.display_name} 전용</small><nav>{["상담 홈","상담 신청","상담 내역"].map(t=><button key={t} aria-current={t===tab?"page":undefined} onClick={()=>setTab(t)}>{t}</button>)}</nav><Link href="/home">← 사이트로 돌아가기</Link></aside>
    <div className="deskContent"><header><h1>도사님 상담 관리</h1><select aria-label="신규 상담 접수 상태" disabled={busy} value={adviser.accepting?"yes":"no"} onChange={e=>{const yes=e.target.value==="yes";act(async()=>{const {error}=await db.rpc("consult_availability",{p_accepting:yes});if(error)throw error;});}}><option value="yes">상담 가능</option><option value="no">접수 일시중지</option></select></header>
    {notice&&<p role="status">{notice}</p>}
    {tab==="상담 홈"&&<div className="deskStats">{["대기 중","진행 중","오늘 완료"].map((s,i)=><div key={s}>{s}<strong>{totals[i]}건</strong></div>)}</div>}
    {tab!=="상담 내역"&&panel("대기 중인 상담 신청",waiting,"waiting")}
    {tab==="상담 홈"&&panel("진행 중인 상담",active,"active")}
    {tab!=="상담 신청"&&panel(tab==="상담 홈"?"최근 완료한 상담":"완료한 상담",tab==="상담 홈"?data.history.slice(0,3):data.history,"history")}
    <section className="deskPanel"><IssueInvite db={db}/><button disabled={busy} onClick={()=>act(async()=>{await enablePush(db);window.alert("상담 알림을 설정했습니다.");})}>이 기기에서 상담 알림 받기</button></section></div>
    {currentRoom && <MessengerWindow key={currentRoom.id+(currentRoom.finished??"")}
      title={currentRoom.customer_name+(currentRoom.finished?" · 완료된 상담":" · 상담 메신저")} onClose={closeMessenger}>
      <RoomComponent view="room" roomId={currentRoom.id} finished={currentRoom.finished} after={currentRoom.previous_finished}
        customerName={currentRoom.customer_name} embedded />
    </MessengerWindow>}
    </main>;
}
