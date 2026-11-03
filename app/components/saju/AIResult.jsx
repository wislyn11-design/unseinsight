
import React, { useState, useEffect, useRef } from 'react';


// 💡 마지막 괄호 닫기 전에 onRequireLogin을 꼭 추가해 주세요!
  export default function AIResult({ saju, interpretation, loading, error, onRequest, onRequireLogin, autoStart = false, isActive = true }) {
  const [isOpen, setIsOpen] = useState(autoStart); 
  const autoStartedRef = useRef(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const MAX_FREE_CHAT = 3; 
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!autoStart) return;
    setIsOpen(true);
    if (!autoStartedRef.current && !interpretation && !loading && !error) {
      autoStartedRef.current = true;
      onRequest();
    }
  }, [autoStart, interpretation, loading, error, onRequest]);

  // 💡 [선생님 아이디어 반영] 현재 사용자가 어디까지 보았는지 단계를 관리하는 상태 (1~4단계)
  const [activeStep, setActiveStep] = useState(1);

// 🟢 👇👇👇 여기에 아래 코드를 복사해서 붙여넣어 주세요! 👇👇👇 🟢
const [loadingMsg, setLoadingMsg] = useState("🔮 우주의 기운을 모아 명식을 세우는 중...");
//const [countdown, setCountdown] = useState(45);

useEffect(() => {
  if (!loading) return;

  const messages = [
    "🔮 우주의 기운을 모아 명식을 세우는 중...",
    "✨ 오행의 조화와 기운의 흐름을 정밀 분석 중...",
    "📜 타고난 기질과 평생의 무기를 찾아내는 중...",
    "⚖️ 대운과 세운의 상호작용을 계산 중...",
    "🧙‍♂️ 고객님만을 위한 맞춤형 멘토링을 작성 중..."
  ];
  
  let msgIndex = 0;
  //setCountdown(45); // Pro 모델의 평균 소요 시간

  const msgInterval = setInterval(() => {
    msgIndex = (msgIndex + 1) % messages.length;
    setLoadingMsg(messages[msgIndex]);
  }, 3500);

  //const timerInterval = setInterval(() => {
   // setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
  //}, 1000);

  return () => {
    clearInterval(msgInterval);
    //clearInterval(timerInterval);
  };
}, [loading]);
// 🟢 👆👆👆 여기까지 붙여넣어 주세요! 👆👆👆 🟢




  useEffect(() => {
    if (interpretation) {
      setMessages([{ type: 'ai', text: interpretation }]);
    }
  }, [interpretation]);

  useEffect(() => {
    if (!isActive || (autoStart && messages.length <= 1)) return;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeStep, autoStart, isActive]); // 💡 해결: 메시지 '개수(length)'가 늘어날 때나 '다음 단계'를 누를 때만 스크롤 실행!


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
      const res = await fetch('/api/ai_chat', {
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

// 💡 별표(**)로 감싸진 텍스트를 진하게(bold) 바꿔주는 마법의 함수
// 💡 기존 formatText 함수를 통째로 지우고 아래 함수로 교체해 주세요!
const formatText = (text) => {
  if (!text) return null;
  
  // 💡 핵심 마법 1: 마침표(.) 뒤에 띄어쓰기가 오는 경우를 찾아 모조리 줄바꿈(\n)으로 바꿔버립니다!
  const sentenceBrokenText = text.replace(/\. /g, '.\n');
  
  // 2. 이제 줄바꿈(\n)을 기준으로 문장을 쪼갭니다.
  return sentenceBrokenText.split('\n').map((line, lineIndex) => {
    
    // 3. 엔터만 있는 빈 줄이면 띄어쓰기(문단 간격) 공간을 넉넉하게 만들어 줍니다.
    if (line.trim() === '') {
      return <div key={lineIndex} style={{ height: '16px' }} />;
    }
    
    // 4. 글자가 있는 줄이면 별표(**)를 찾아 진하게(bold) 만듭니다.
    const formattedLine = line.split(/(\*\*.*?\*\*)/g).map((part, partIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={partIndex} style={{ color: '#111', fontWeight: '900' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    // 💡 핵심 마법 2: 각각의 문장을 <div>로 감싸서 한 줄씩 차지하도록 만들고, 
    // wordBreak: 'keep-all'을 추가해 한국어 단어가 줄 끝에서 반으로 쪼개지지 않게 보호합니다.
    return (
      <div key={lineIndex} style={{ marginBottom: '8px', wordBreak: 'keep-all', lineHeight: '1.8' }}>
        {formattedLine}
      </div>
    );
  });
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
           ✨운세 풀이 상담 
         </button>
       </div>
     )
  }

  // Replace only the legacy opening self-introduction in the displayed free reading.
  const stripLegacyIntroduction = (text) => {
    if (!autoStart || !/^\s*(?:#{1,3}\s*)?안녕하세요/.test(text)) return text;
    const paragraphs = text.split(/\r?\n[ \t]*\r?\n/);
    if (!/(?:30년|명리학[^\n]*대가|심리\s*상담사)/.test(paragraphs[0])) return text;
    return paragraphs.slice(1).join('\n\n').replace(/^\s*---[ \t]*(?:\r?\n|$)/, '').trimStart();
  };

  // 첫 번째 AI 총평 메시지 파싱
  const aiFirstResponse = messages.find(m => m.type === 'ai')?.text || '';
  const parsedSteps = parseSections(stripLegacyIntroduction(aiFirstResponse));
// 💡 대략 70번째 줄 부근입니다. width와 height를 100%로 변경해 주세요!

return (
  // 💡 전체 화면을 덮는 방식(fixed)을 빼고, 만세력 아래에 100% 너비로 자연스럽게 이어붙도록 변경했습니다.
  <div className={autoStart ? 'free-reading-panel' : undefined} style={{ width: '100%', minWidth: 0, height: autoStart ? 'auto' : '800px', background: '#f5f7ff', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      
  
      <style>{`
        .free-reading-panel { min-width: 0; }
        .free-reading-panel .reading-intro { margin: 22px 22px 4px; padding: 22px; background: #fff; border: 1px solid #dbe5f6; border-radius: 14px; }
        .free-reading-panel .reading-intro h2 { margin: 0 0 12px; color: #19345d; font-size: 24px; line-height: 1.5; font-weight: 800; word-break: keep-all; }
        .free-reading-panel .reading-intro p { margin: 0; color: #455570; font-size: 18px; line-height: 1.85; word-break: keep-all; }
        .free-reading-panel .reading-content { font-size: 25px !important; line-height: 1.8 !important; overflow-wrap: anywhere; }
        .free-reading-panel .reading-title { font-size: 22px !important; line-height: 1.6; }
        .free-reading-panel .reading-message { font-size: 20px !important; }
        .free-reading-panel .reading-result-card { padding: 24px !important; }
        .free-reading-panel .reading-header { font-size: 18px !important; }
        .free-reading-panel .reading-count { font-size: 14px !important; }
        .free-reading-panel .reading-compose { flex-wrap: wrap; }
        .free-reading-panel .reading-compose input { min-width: 160px; }
        @media (max-width: 639px) {
          .free-reading-panel .reading-content, .free-reading-panel .reading-message { font-size: 17px !important; }
          .free-reading-panel .reading-title { font-size: 20px !important; }
          .free-reading-panel .reading-intro { margin: 12px 10px 0; padding: 16px !important; }
          .free-reading-panel .reading-intro h2 { font-size: 20px; }
          .free-reading-panel .reading-intro p { font-size: 15px; }
          .free-reading-panel .reading-result-card { padding: 16px !important; }
          .free-reading-panel .reading-header { font-size: 16px !important; }
          .free-reading-panel .reading-count { font-size: 12px !important; }
        }
        .free-reading-panel > div:first-of-type { flex-wrap: wrap; gap: 10px; }
        .free-reading-panel input { min-width: 0; }
        @media (max-width: 639px) {
          .free-reading-panel > div { padding-left: 12px !important; padding-right: 12px !important; }
          .free-reading-panel input { padding: 12px 10px !important; }
          .free-reading-panel button { min-height: 44px; }
          .free-reading-panel input + button { padding: 0 14px !important; }
        }
      `}</style>
      {/* 상단 헤더 */}
      <div style={{ background: '#3a5bbf', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <span className="reading-header" style={{ fontWeight: 'bold', fontSize: 16 }}> 무료 사주풀이 · 질문 3회</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="reading-count" style={{ fontSize: 12, background: chatCount >= MAX_FREE_CHAT ? '#e74c3c' : 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 12 }}>
            남은 질문: {MAX_FREE_CHAT - chatCount}회
          </span>
          {!autoStart && <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>✕</button>}
        </div>
      </div>

      {autoStart && (
        <section className="reading-intro" aria-label="운세인사이트 풀이 안내">
          <h2>정확한 사주는 정확한 만세력에서 시작됩니다.</h2>
          <p>절입 시각, 출생지 시차, 서머타임 중 하나만 빠져도 사주가 달라질 수 있습니다. 운세인사이트는 한국천문연구원 천문 데이터를 기준으로 이 모두를 반영해 명식을 계산하고, 그 원국에서 풀이를 시작합니다. 궁금한 점은 무료로 3번까지 물어보세요.</p>
        </section>
      )}

      {/* 중앙 콘텐츠 영역 */}
      <div style={{ flex: 1, padding: '10px', overflowY: autoStart ? 'visible' : 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>  
        
      {/* 💡 기존의 단순했던 로딩 화면을 프리미엄 카운트다운 화면으로 교체! */}
        {loading && (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 56, marginBottom: 20, animation: 'pulse 1.5s infinite' }}>⏳</div>
            
            {/* 동적으로 바뀌는 텍스트 */}
            <div style={{ color: '#3a5bbf', fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>
              {loadingMsg}
            </div>
            
            {/* 긴장감을 주는 카운트다운 숫자 */}
            {/*
            <div style={{ color: '#e74c3c', fontSize: 32, fontWeight: '900', marginTop: 20 }}>
              {countdown > 0 ? `${countdown}초 남음` : "거의 다 되었습니다! 마무리 중..."}
            </div>
            */}
            
            <div style={{ color: '#888', fontSize: 14, marginTop: 16, lineHeight: '1.6' }}>
              정밀하고 깊이 있는 명리학 분석을 위해<br/> 사주를 풀이하는 데 시간이 소요됩니다.
            </div>
          </div>
        )}



        {!loading && error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
            <strong>운세 데이터를 가져오는 중 오류가 발생했습니다.</strong>
            <button type="button" onClick={onRequest} style={{ display: 'block', margin: '12px auto 0', padding: '12px 16px', borderRadius: 8 }}>다시 불러오기</button>
          </div>
        )}

        {/* 💡 첫 운세 결과 (다음 버튼 없이 5개 카드를 한 번에 출력)  글씨크기*/}
        {!loading && parsedSteps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: 28, textAlign: 'center' }}>🧙‍♂️</div>
            
            {parsedSteps.map((step, index) => (
              <div key={index} className="reading-result-card" style={{ background: '#fff', padding: '16px 12px', borderRadius: '16px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>


                <h3 className="reading-title" style={{ margin: '0 0 12px', color: '#3a5bbf', fontSize: 17, fontWeight: 'bold', borderBottom: '2px solid #f0f2ff', paddingBottom: '8px' }}>
                  {step.title}
                </h3>
                
                <div className="reading-content" style={{ fontSize: autoStart ? 16 : 20, lineHeight: '1.8', color: '#333' }}>
                  {formatText(step.content)}
                </div>


              </div>
            ))}
          </div>
        )}

       
        {/* 추가 1:1 대화 메시지들 (첫 운세 아래에 자연스럽게 배치) */}
        {!loading && messages.slice(1).map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: msg.type === 'user' ? 'row-reverse' : 'row', gap: '10px' }}>
            {msg.type === 'ai' && <div style={{ fontSize: 28 }}>🧙‍♂️</div>}
            <div className="reading-message" style={{ maxWidth: '80%', padding: '14px 18px', fontSize: 15, lineHeight: '1.6', whiteSpace: 'pre-wrap', background: msg.type === 'user' ? '#3a5bbf' : '#fff', color: msg.type === 'user' ? '#fff' : '#333', border: msg.type === 'ai' ? '1px solid #e0e0e0' : 'none', borderRadius: '20px', borderTopRightRadius: msg.type === 'user' ? 4 : 20, borderTopLeftRadius: msg.type === 'ai' ? 4 : 20, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              {/* 💡 해결: AI가 답변한 내용일 때만 formatText 마법을 걸어 진한 글씨로 바꿔줍니다! */}
              {msg.type === 'ai' ? formatText(msg.text) : msg.text}
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
      {!loading && parsedSteps.length > 0 && (
        chatCount >= MAX_FREE_CHAT ? (
          
          <div style={{ background: '#fff', padding: '24px 20px', textAlign: 'center', borderTop: '1px solid #e0e0e0', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
            <p style={{ margin: '0 0 12px', fontSize: 15, color: '#e74c3c', fontWeight: 'bold' }}>무료 상담 횟수가 모두 소진되었습니다.</p>
            <button 
              onClick={onRequireLogin} /* 💡 페이지 이동 없이, 메인 페이지의 모달 창을 띄우는 신호를 보냅니다! */
              style={{ width: '100%', padding: '16px', background: '#f39c12', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}
            >
              ⭐ 프리미엄 구독하고 무제한 상담하기
            </button>
          </div>




        ) : (
          <div className="reading-compose" style={{ background: '#fff', padding: '16px 20px', display: 'flex', gap: '10px', borderTop: '1px solid #e0e0e0', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            <input 
              type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="궁금한 점을 물어보세요! (예: 올해 이직운은?)" spellCheck={false} autoComplete="off"
              style={{ flex: 1, minWidth: 0, padding: '14px 16px', borderRadius: 12, border: '1px solid #ddd', fontSize: 16, outline: 'none', background: '#f9f9f9' }} disabled={isChatLoading}
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