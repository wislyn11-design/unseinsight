import React, { useState, useEffect, useRef } from 'react';

export default function AIResult({ saju, interpretation, loading, error, onRequest }) {
  const [isOpen, setIsOpen] = useState(false); 
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const MAX_FREE_CHAT = 3; 
  const chatEndRef = useRef(null);

  // 💡 [선생님 아이디어 반영] 현재 사용자가 어디까지 보았는지 단계를 관리하는 상태 (1~4단계)
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    if (interpretation) {
      setMessages([{ type: 'ai', text: interpretation }]);
    }
  }, [interpretation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeStep]); // 단계가 바뀔 때도 아래로 스무스하게 스크롤

  const handleStart = () => {
    setIsOpen(true);
    setActiveStep(1); // 시작할 때는 1단계부터
    if (!interpretation && !loading) {
      onRequest();
    }
  };

  // 💡 실시간 스트리밍 대화(채팅) 로직 복구 및 최적화
  const handleSend = async () => {
    if (!input.trim() || chatCount >= MAX_FREE_CHAT) return;
    
    const userMsg = input;
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

      setIsChatLoading(false);
      setMessages(prev => [...prev, { type: 'ai', text: "" }]);
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let currentText = "";

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

  // 💡 AI가 주는 긴 글을 ### 기준으로 쪼개서 이쁘게 정돈해주는 가공 함수
  const parseSections = (text) => {
    if (!text) return [];
    // '###' 기호로 섹션을 나눕니다.
    const rawSections = text.split('###');
    const sections = [];
    
    rawSections.forEach(sec => {
      const lines = sec.trim().split('\n');
      if (lines.length > 0 && lines[0].trim()) {
        const title = lines[0].replace(/^[0-9.\s]+/, '').trim(); // 소제목 추출
        const content = lines.slice(1).join('\n').trim(); // 본문 추출
        if (content) {
          sections.push({ title, content });
        }
      }
    });
    return sections;
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

  // 첫 번째 AI 총평 메시지 파싱
  const aiFirstResponse = messages.find(m => m.type === 'ai')?.text || '';
  const parsedSteps = parseSections(aiFirstResponse);
// 💡 대략 70번째 줄 부근입니다. width와 height를 100%로 변경해 주세요!
return (
  <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#f5f7ff', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
  
  
      {/* 상단 헤더 */}
      <div style={{ background: '#3a5bbf', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <span style={{ fontWeight: 'bold', fontSize: 16 }}>🤖 AI 명리 상담사</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: 12, background: chatCount >= MAX_FREE_CHAT ? '#e74c3c' : 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 12 }}>
            남은 질문: {MAX_FREE_CHAT - chatCount}회
          </span>
          <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
      </div>

      {/* 중앙 콘텐츠 영역 */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {loading && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>🔮</div>
            <div style={{ color: '#3a5bbf', fontWeight: 'bold', fontSize: 16 }}>운명의 흐름을 읽고 있습니다...</div>
            <div style={{ color: '#888', fontSize: 13, marginTop: 8 }}>잠시만 기다려주세요!</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
            <strong>운세 데이터를 가져오는 중 오류가 발생했습니다.</strong>
          </div>
        )}

        {/* 💡 첫 운세 결과를 선생님의 아이디어대로 단계별 카드로 노출 */}
        {!loading && parsedSteps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: 28, textAlign: 'center' }}>🧙‍♂️</div>
            
            {parsedSteps.map((step, index) => {
              const stepNum = index + 1;
              if (stepNum > activeStep) return null; // 현재 활성화된 단계까지만 노출

              return (
                <div key={index} style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.3s ease' }}>
                  <h3 style={{ margin: '0 0 12px', color: '#3a5bbf', fontSize: 17, fontWeight: 'bold', borderBottom: '2px solid #f0f2ff', paddingBottom: '8px' }}>
                    {step.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: '1.7', color: '#333', whiteSpace: 'pre-wrap' }}>
                    {step.content}
                  </p>
                  
                  {/* 다음 단계로 넘어가는 인터랙티브 버튼 */}
                  {stepNum === activeStep && activeStep < parsedSteps.length && (
                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                      <button 
                        onClick={() => setActiveStep(prev => prev + 1)}
                        style={{ padding: '10px 20px', background: '#3a5bbf', color: '#fff', border: 'none', borderRadius: '20px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 6px rgba(58,91,191,0.2)' }}
                      >
                        👇 다음 운세 내용 보기
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 추가 1:1 대화 메시지들 (4단계를 모두 마친 후 챗창 하단에 자연스럽게 배치) */}
        {!loading && activeStep >= parsedSteps.length && messages.slice(1).map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: msg.type === 'user' ? 'row-reverse' : 'row', gap: '10px' }}>
            {msg.type === 'ai' && <div style={{ fontSize: 28 }}>🧙‍♂️</div>}
            <div style={{ maxWidth: '80%', padding: '14px 18px', fontSize: 15, lineHeight: '1.6', whiteSpace: 'pre-wrap', background: msg.type === 'user' ? '#3a5bbf' : '#fff', color: msg.type === 'user' ? '#fff' : '#333', border: msg.type === 'ai' ? '1px solid #e0e0e0' : 'none', borderRadius: '20px', borderTopRightRadius: msg.type === 'user' ? 4 : 20, borderTopLeftRadius: msg.type === 'ai' ? 4 : 20, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {isChatLoading && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ fontSize: 28 }}>🧙‍♂️</div>
            <div style={{ background: '#fff', padding: '14px 18px', borderRadius: '20px', borderTopLeftRadius: 4, border: '1px solid #e0e0e0', color: '#888', fontSize: 14 }}>
              만세력을 바탕으로 답변을 고민 중입니다...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 하단 입력창 (모든 운세를 다 읽은 후 대화할 수 있도록 활성화) */}
      {activeStep >= parsedSteps.length && !loading && (
        chatCount >= MAX_FREE_CHAT ? (
          <div style={{ background: '#fff', padding: '24px 20px', textAlign: 'center', borderTop: '1px solid #e0e0e0', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
            <p style={{ margin: '0 0 12px', fontSize: 15, color: '#e74c3c', fontWeight: 'bold' }}>무료 상담 횟수가 모두 소진되었습니다.</p>
            <button style={{ width: '100%', padding: '16px', background: '#f39c12', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>⭐ 프리미엄 구독하고 무제한 상담하기</button>
          </div>
        ) : (
          <div style={{ background: '#fff', padding: '16px 20px', display: 'flex', gap: '10px', borderTop: '1px solid #e0e0e0', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            <input 
              type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="궁금한 점을 물어보세요! (예: 올해 이직운은?)" spellCheck={false} autoComplete="off"
              style={{ flex: 1, padding: '14px 16px', borderRadius: 12, border: '1px solid #ddd', fontSize: 15, outline: 'none', background: '#f9f9f9' }} disabled={isChatLoading}
            />
            <button 
              onClick={handleSend} disabled={isChatLoading || !input.trim()}
              style={{ padding: '0 24px', background: '#3a5bbf', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 'bold', fontSize: 15, cursor: 'pointer', opacity: isChatLoading || !input.trim() ? 0.6 : 1 }}
            >
              전송
            </button>
          </div>
        )
      )}
    </div>
  );
}