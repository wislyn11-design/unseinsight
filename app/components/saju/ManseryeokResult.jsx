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
    // 💡 화면 넓게 쓰도록 이전에 수정한 max-w-7xl 유지!
    <div className="mx-auto max-w-7xl px-5 pt-14 pb-20">
      
      {/* 상단 헤더 및 다시하기 버튼 */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-black text-foreground">사주 분석 결과</h2>
        <button 
          onClick={onReset} 
          className="text-sm font-bold text-muted-foreground hover:text-foreground underline transition-colors"
        >
          다시 입력하기
        </button>
      </div>

      {/* 1. 만세력 표 (사주 원국) */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="min-w-[400px] md:min-w-full">
          <SajuTable saju={saju} form={data} />
        </div>
      </div>

      {/* 2. 운의 흐름 (대운, 세운, 월운) */}
      <div className="mt-8 flex flex-col gap-6">
        
        <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
          <div className="min-w-[750px] lg:min-w-full">
            <Daeun 
              daeun={saju.daeun} 
              dayGan={saju.day.gan} 
              birthYear={data.year} 
            />
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
          <div className="min-w-[750px] lg:min-w-full">
            <Seun saju={saju} />
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
          <div className="min-w-[750px] lg:min-w-full">
            <Wolun saju={saju} />
          </div>
        </div>
        
      </div>

      {/* 3. AI 상담 버튼 */}
      {/* 👇👇👇 3. 가짜 데이터를 지우고 실제 상태와 함수를 연결했습니다! 👇👇👇 */}
      
      <div className="mt-12 w-full">
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