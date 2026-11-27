"use client";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";

const day = new Intl.DateTimeFormat("ko-KR", { timeZone:"Asia/Seoul", year:"numeric", month:"long", day:"numeric", weekday:"long" });
const clock = new Intl.DateTimeFormat("ko-KR", { timeZone:"Asia/Seoul", hour:"numeric", minute:"2-digit" });
const statusText = { waiting:"답변 대기 중", active:"상담 중", closed:"상담 종료" };

export default function ChatRoom({archive=false,onBack,customerName,embedded,data, uid, staff, busy, notice, draft, changeDraft, send, handle, choose, canChoose}) {
  const {messages,room,advisors,target} = data;
  const name = advisors.find(a=>a.user_id===target)?.display_name || "도사님";
  const customer = customerName || (room ? "고객 "+room.customer_id.slice(0,8) : "고객");
  const scroll = useRef(null);
  const following = useRef(true);
  const [menu,setMenu] = useState(false);
  const returningCustomer = !staff && !archive && room?.dosa_approved;
  const away = returningCustomer && advisors.some(a=>a.user_id===target && a.accepting===false);
  const showApproval = !staff && room?.approval_required && room.status==="active" &&
    advisors.some(adviser=>adviser.user_id===room.adviser_id && adviser.consult_channel==="dosa");
  const writable = !archive && target && (!staff || room?.status==="active");
  useEffect(()=>{
    if(following.current && scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight;
  },[messages.length, room?.id]);
  return <main className="dosaScreen"><div className="dosaRoom">
    <header className="dosaTop">
      {onBack?<button className="dosaAction" aria-label="상담 목록" onClick={onBack}>‹</button>:!embedded?<Link className="dosaAction" href={staff?"/consult/me":"/home"} aria-label={staff?"상담 목록":"홈으로"}>‹</Link>:null}
      <img className="dosaIcon" src="/consult/dosa-symbol.png" alt=""/>
      <div className="dosaHeading"><h1>{staff?customer+" 상담":name+" 상담"}</h1>{room&&<small>{returningCustomer && room.status!=="active"?"메시지를 남겨 주세요":statusText[room.status]}</small>}</div>
      <button className="dosaAction" aria-label="상담 메뉴" aria-expanded={menu} onClick={()=>setMenu(!menu)}>☰</button>
      {menu&&<nav className="dosaMenu"><Link href="/consult/me">마이페이지</Link>
        {staff&&room?.status==="active"&&<button disabled={busy} onClick={()=>{setMenu(false);handle("close");}}>상담 종료</button>}</nav>}
    </header>
    {away && <div role="status" style={{background:"#fff4d6",padding:"8px 14px",flexShrink:0}}>
      <strong>지금은 부재중이십니다.</strong> 메시지를 남겨 주시면 도사님이 확인 후 답장드립니다.
    </div>}
    {canChoose&&<label className="dosaChoose">상담할 도사님 <select disabled={busy} value={target} onChange={e=>choose(e.target.value)}>{advisors.filter(a=>a.active).map(a=><option key={a.user_id} value={a.user_id}>{a.display_name}</option>)}</select></label>}
    <section ref={scroll} className="dosaThread" aria-label="상담 대화" onScroll={e=>{const el=e.currentTarget;following.current=el.scrollHeight-el.scrollTop-el.clientHeight<80;}}>
      {showApproval && <p className="dosaDay" role="status">도사님이 상담을 승인하셨습니다. 메시지를 보내세요.</p>}
      {archive && !messages.length && <p className="dosaEmpty">저장된 대화가 없습니다.</p>}
      {!archive && !showApproval && !messages.length&&<p className="dosaEmpty">{target?"첫 질문을 보내면 상담이 시작돼요.":"현재 상담 가능한 도사님이 없습니다."}</p>}
      {messages.map((m,i)=>{
        const mine=m.sender_id===uid;
        const date=new Date(m.sent_at), label=day.format(date);
        const newDay=!i || label!==day.format(new Date(messages[i-1].sent_at));
        const group=newDay || messages[i-1].sender_id!==m.sender_id;
        return <Fragment key={m.sender_id+m.client_message_id}>
          {newDay&&<div className="dosaDay">{label}</div>}
          <div className={"dosaLine"+(mine?" outgoing":"")}>
            {!mine&&<div className="dosaAvatar">{group&&(staff?<span aria-hidden="true">고</span>:<img src="/consult/dosa-symbol.png" alt=""/>)}</div>}
            <div className="dosaContent">{!mine&&group&&<strong>{staff?customer:name}</strong>}
              <div className="dosaMessage"><span>{m.body}</span><time dateTime={m.sent_at}>{clock.format(date)}</time></div>
            </div>
          </div>
        </Fragment>;
      })}
    </section>
    <footer className="dosaFoot">{notice&&<p role="status">{notice}</p>}
      {writable?<form className="dosaComposer" onSubmit={e=>{following.current=true;send(e);}}>
        <textarea rows="1" maxLength={8000} aria-label="메시지 입력" placeholder={room?.status==="closed"?"새 상담 질문 입력":"메시지 입력"} value={draft} disabled={busy} onChange={e=>changeDraft(e.target.value)}/>
        <button disabled={busy||!draft.trim()} aria-label="메시지 보내기">↑</button>
      </form>:staff&&room?.status==="waiting"?<button className="dosaStart" disabled={busy} onClick={()=>handle("start")}>채팅 시작</button>:null}
    </footer>
  </div></main>;
}
