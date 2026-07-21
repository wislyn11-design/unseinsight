import React, { useState, useEffect } from "react";
import SajuTable from "./SajuTable"; 
import Daeun from "./Daeun";
import Seun from "./Seun";
import Wolun from "./Wolun";
import AIResult from "./AIResult"; 

export function ManseryeokResult({ data, onReset, onRequireLogin }) {
  const [saju, setSaju] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 👇👇👇 1. AI 전용 상태 3가지를 추가했습니다 👇👇👇
  const [aiInterpretation, setAiInterpretation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // 💡 폼에서 넘어온 데이터를 API로 보내 만세력 계산 결과를 가져옵니다.
  useEffect(() => {
    const fetchSaju = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/saju', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        console.log("서버에서 온 데이터 구조:", result.saju);

        if (result.success) {
          setSaju(result.saju);
        } else {
          setError(result.error || "계산 중 오류가 발생했습니다.");
        }
      } catch (e) {
        setError("서버와 통신할 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };
    
    if (data) fetchSaju();
  }, [data]);

  
  
// 👇👇👇 2. 버튼을 누르면 실행될 AI 스트리밍 요청 함수입니다 👇👇👇
const handleAiRequest = async () => {
  try {
    setAiLoading(true);
    setAiError(null);
    setAiInterpretation(""); // 새 요청 시 기존 답변 초기화
    
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saju: saju }) 
    });
    
    if (!response.ok) throw new Error("AI 서버와 연결할 수 없습니다.");

    // 💡 여기서부터 변경! 카운트다운 로딩을 끄고 즉시 타자 효과(Streaming)를 시작합니다.
    setAiLoading(false); 
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;
    let currentText = "";

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        currentText += decoder.decode(value, { stream: true });
        setAiInterpretation(currentText); // 화면에 실시간으로 글자를 뿌립니다.
      }
    }
    
  } catch (e) {
    setAiError("AI 분석 중 통신 오류가 발생했습니다.");
    setAiLoading(false);
  }
};



  if (loading) return <div className="text-center pt-20 font-bold text-primary">운명의 흐름을 읽고 있습니다...</div>;
  if (error) return <div className="text-center pt-20 text-red-500">{error}</div>;
  if (!saju) return null;

  return (
    <div className="mx-auto max-w-7xl px-1 pt-14 pb-20">
      
      {/* 💡 모든 영역에 w-full max-w-3xl mx-auto 를 적용하여 가로 폭을 완벽히 맞춥니다. */}
      
      {/* 상단 헤더 및 다시하기 버튼 */}
      <div className="mb-6 flex justify-between items-center w-full max-w-3xl mx-auto px-2"> 
        <h2 className="text-2xl font-black text-foreground">사주 분석 결과</h2>
        <button 
          onClick={onReset} 
          className="text-base font-bold text-muted-foreground hover:text-foreground underline transition-colors"
        >
          다시 입력하기
        </button>
      </div>

      {/* 1. 만세력 표 (사주 원국) */}
      <div className="w-full max-w-3xl mx-auto pb-4">
        <SajuTable saju={saju} form={data} />
      </div>

      {/* 2. 운의 흐름 (대운, 세운, 월운) */}
      <div className="mt-3 flex flex-col gap-2 w-full items-center">
        
        <div className="w-full max-w-3xl pb-2 overflow-hidden">
          <Daeun daeun={saju.daeun} dayGan={saju.day.gan} birthYear={data.year} />
        </div>

        <div className="w-full max-w-3xl pb-2 overflow-hidden">
          <Seun saju={saju} />
        </div>

        <div className="w-full max-w-3xl pb-2 overflow-hidden">
          <Wolun saju={saju} />
        </div>
        
      </div>

      {/* 3. AI 상담 버튼 */}
      <div className="mt-4 w-full max-w-3xl mx-auto px-1">
        <AIResult 
          saju={saju} 
          interpretation={aiInterpretation} 
          loading={aiLoading} 
          error={aiError} 
          onRequest={handleAiRequest} 
          onRequireLogin={onRequireLogin} 
        />
      </div>

    </div>
  )
}