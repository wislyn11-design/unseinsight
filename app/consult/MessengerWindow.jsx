"use client";
import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import "./messenger-window.css";

const clamp=(value,min,max)=>Math.min(Math.max(value,min),max);
function fit(box){
  const maxWidth=Math.max(1,document.documentElement.clientWidth-16);
  const maxHeight=Math.max(1,window.innerHeight-16);
  const width=clamp(box?.width??436,Math.min(300,maxWidth),maxWidth);
  const height=clamp(box?.height??734,Math.min(240,maxHeight),maxHeight);
  return {width,height,left:clamp(box?.left??(maxWidth+16-width)/2,8,maxWidth+8-width),
    top:clamp(box?.top??(maxHeight+16-height)/2,8,maxHeight+8-height)};
}
export default function MessengerWindow({title,onClose,onMinimize,minimized=false,children}){
  const [box,setBox]=useState(()=>fit());
  const gesture=useRef(null);
  useEffect(()=>{
    const adjust=()=>setBox(previous=>fit(previous));
    window.addEventListener("resize",adjust);
    return ()=>window.removeEventListener("resize",adjust);
  },[]);
  function start(event,resize){
    if(!event.isPrimary || event.button!==0 || (!resize && event.target.closest("button")))return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current={box,x:event.clientX,y:event.clientY,resize,id:event.pointerId};
  }
  function change(box,dx,dy,resize){
    if(!resize)return fit({...box,left:box.left+dx,top:box.top+dy});
    return fit({...box,width:Math.min(box.width+dx,document.documentElement.clientWidth-box.left-8),
      height:Math.min(box.height+dy,window.innerHeight-box.top-8)});
  }
  function move(event){
    const g=gesture.current;
    if(g && g.id===event.pointerId)setBox(change(g.box,event.clientX-g.x,event.clientY-g.y,g.resize));
  }
  function keys(event,resize){
    if(event.target!==event.currentTarget)return;
    const delta={ArrowLeft:[-16,0],ArrowRight:[16,0],ArrowUp:[0,-16],ArrowDown:[0,16]}[event.key];
    if(delta){event.preventDefault();setBox(old=>change(old,...delta,resize));}
  }
  return createPortal(<section className="vipFloat adviserWindow" hidden={minimized} role="dialog" aria-label={title} style={box}
    onPointerMove={move} onLostPointerCapture={()=>{gesture.current=null;}}
    onKeyDown={e=>{if(e.key==="Escape")onClose();}}>
    <header className="vipBar windowGrip" tabIndex={0} title="드래그하거나 방향키로 이동"
      onKeyDown={e=>keys(e,false)} onPointerDown={e=>start(e,false)}>
      <strong>{title}</strong>
      {onMinimize && <button type="button" aria-label="최소화" onClick={onMinimize}>−</button>}
      <button type="button" autoFocus aria-label="상담창 닫기" onClick={onClose}>×</button>
    </header>
    <div className="windowBody">{children}</div>
    <button type="button" className="windowSizer" aria-label="크기 조절" title="드래그하거나 방향키로 크기 조절"
      onKeyDown={e=>keys(e,true)} onPointerDown={e=>start(e,true)}>◢</button>
  </section>,document.body);
}
