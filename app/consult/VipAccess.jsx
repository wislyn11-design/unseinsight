"use client";
import {useState} from "react";

export function VipAccess({db,uid,onUnlock}){
  const [code,setCode]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  async function submit(e){
    e.preventDefault();setBusy(true);setError("");
    try{
      const {data,error}=await db.rpc("consult_unlock",{p_code:code.trim()});
      if(error)throw error;
      if(data){setCode("");onUnlock(data);}
      else setError("비밀번호와 로그인 계정을 확인해 주세요. 5회 실패하면 10분 뒤 다시 시도할 수 있어요.");
    }catch{setError("입장 확인에 실패했습니다. 다시 시도해 주세요.");}
    finally{setBusy(false);}
  }
  return <section className="vipGate"><img src="/consult/dosa-symbol.png" alt="" width="52" height="52"/>
    <h2>도사님 VIP 상담</h2><p>도사님께 안내받은 비밀번호를 입력해 주세요.</p>
    <form onSubmit={submit}><label>상담 비밀번호<input type="password" value={code} autoComplete="off" required maxLength={64} onChange={e=>setCode(e.target.value)}/></label>
    {error&&<small role="alert">{error}</small>}<button disabled={busy}>채팅창 열기</button></form><details><summary>내 고객 UID 확인</summary><code>{uid}</code></details></section>;
}
export function IssueInvite({db}){
  const [id,setId]=useState(""),[code,setCode]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  return <details className="vipIssue"><summary>VIP 비밀번호 발급</summary>
    <form onSubmit={async e=>{e.preventDefault();setBusy(true);setCode("");setError("");
      try{const {data,error}=await db.rpc("consult_issue_vip",{p_customer:id.trim()});if(error)throw error;setCode(data);}
      catch{setError("고객 UID와 도사님 권한을 확인해 주세요.");}finally{setBusy(false);}
    }}><label>고객 UID<input required value={id} onChange={e=>{setId(e.target.value);setCode("");}}/></label>
    <p>재발급하면 이 고객의 이전 비밀번호가 만료돼요.</p><button disabled={busy}>발급하기</button></form>
    {code&&<p>고객에게 전달할 비밀번호 <strong>{code}</strong></p>}{error&&<p role="alert">{error}</p>}</details>;
}
