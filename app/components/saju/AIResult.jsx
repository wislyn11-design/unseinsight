import React, { useState, useEffect, useRef } from 'react';

export default function AIResult({ saju, interpretation, loading, error, onRequest }) {
  const [isOpen, setIsOpen] = useState(false); 
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const MAX_FREE_CHAT = 3; 
  const chatEndRef = useRef(null);

  useEffect(() => {
    // 실시간으로 써지는 첫 해석을 채팅창 첫 메시지에 실시간으로 반영
    if (interpretation) {
      setMessages([{ type: 'ai', text: interpretation }]);
    }
  }, [interpretation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStart = () => {
    setIsOpen(true);
    if (!interpretation && !loading) {
      onRequest();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || chatCount >= MAX_FREE_CHAT) return;
    
    const userMsg = input;
    // 사용자의 질문 추가
    setMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saju, userMessage: userMsg }),
      });
      
      if (!res.ok) throw new Error("서버 오류가 발생했습니다.");

      setIsChatLoading(false); // 로딩 해제
      // 실시간 글자를 받을 '빈 AI 메시지 방'을 하나 먼저 만듭니다.
      setMessages(prev => [...prev, { type: 'ai', text: "" }]);
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let currentText = "";

      // 💡 [핵심] 조각이 올 때마다 마지막 메시지(AI 방)에 글자를 계속 추가합니다.
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          currentText += chunk;
          setMessages(prev => {
            const newArr = [...prev];
            newArr[newArr.length - 1].text = currentText;
            return newArr;
          });
        }
      }
      setChatCount(prev => prev + 1); 
      
    } catch (err) {
      setIsChatLoading(false);
      setMessages(prev => [...prev, { type: 'ai', text: "서버와 연결할 수 없습니다." }]);
    }
  };

  if (!isOpen) {
     return (
       <div style={{ marginTop: 16 }}>
         {error && (
           <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>
             {error}
           </div>
         )}
         <button 
           onClick={handleStart}
           style={{ width: '100%', padding: '16px', background: '#3a5bbf', color: '#fff', borderRadius: 12, border: 'none', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(58, 91, 191, 0.3)' }}
         >
           ✨ AI 운세 풀이 및 상담 시작하기
         </button>
       </div>
     )
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#f5f7ff', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ background: '#3a5bbf', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <span style={{ fontWeight: 'bold', fontSize: 16 }}>🤖 AI 명리 상담사</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: 12, background: chatCount >= MAX_FREE_CHAT ? '#e74c3c' : 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 12 }}>
            남은 질문: {MAX_FREE_CHAT - chatCount}회
          </span>
          <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>🔮</div>
            <div style={{ color: '#3a5bbf', fontWeight: 'bold', fontSize: 16 }}>운명의 흐름을 읽는 중입니다...</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
            <strong>운세 데이터를 가져오는 중 오류가 발생했습니다.</strong>
          </div>
        )}

        {!loading && messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: msg.type === 'user' ? 'row-reverse' : 'row', gap: '10px' }}>
            {msg.type === 'ai' && <div style={{ fontSize: 28 }}>🧙‍♂️</div>}
            <div style={{ 
              maxWidth: '80%', padding: '14px 18px', fontSize: 15, lineHeight: '1.6', whiteSpace: 'pre-wrap',
              background: msg.type === 'user' ? '#3a5bbf' : '#fff',
              color: msg.type === 'user' ? '#fff' : '#333',
              border: msg.type === 'ai' ? '1px solid #e0e0e0' : 'none',
              borderRadius: '20px', borderTopRightRadius: msg.type === 'user' ? 4 : 20, borderTopLeftRadius: msg.type === 'ai' ? 4 : 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {isChatLoading && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ fontSize: 28 }}>🧙‍♂️</div>
            <div style={{ background: '#fff', padding: '14px 18px', borderRadius: '20px', borderTopLeftRadius: 4, border: '1px solid #e0e0e0', color: '#888', fontSize: 14 }}>
              생각 중입니다...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={{ background: '#fff', padding: '16px 20px', display: 'flex', gap: '10px', borderTop: '1px solid #e0e0e0' }}>
        {/* 💡 [핵심] spellCheck={false} 와 autoComplete="off" 로 네이버 사전 및 툴바 강제 차단! */}
        <input 
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="궁금한 점을 물어보세요! (예: 올해 이직운은?)"
          spellCheck={false}
          autoComplete="off"
          style={{ flex: 1, padding: '14px 16px', borderRadius: 12, border: '1px solid #ddd', fontSize: 15, outline: 'none', background: '#f9f9f9' }}
          disabled={isChatLoading || chatCount >= MAX_FREE_CHAT}
        />
        <button 
          onClick={handleSend} 
          disabled={isChatLoading || !input.trim() || chatCount >= MAX_FREE_CHAT}
          style={{ padding: '0 24px', background: '#3a5bbf', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 'bold', fontSize: 15, cursor: 'pointer' }}
        >
          전송
        </button>
      </div>
    </div>
  );
}