import React, { useState, useEffect, useMemo } from "react";
import SajuTable from "./SajuTable"; 
import Daeun from "./Daeun";
import Seun from "./Seun";
import Wolun from "./Wolun";
import AIResult from "./AIResult"; 

export function ManseryeokResult({ data, onReset, onRequireLogin }) {
  const [saju, setSaju] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [aiInterpretation, setAiInterpretation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    // ... (기존과 동일한 fetchSaju 로직)
    const fetchSaju = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/saju', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
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

  // 🟢 [수정 1] 두 번 중복되던 로직을 useMemo로 묶어서 딱 한 번만 계산하게 만듭니다.
  const enrichedSaju = useMemo(() => {
    if (!saju || !data) return null;
    return {
      ...saju,
      gender: data.gender === "여" ? "여성" : "남성",
      birthTime: data.hourInput ? `${data.hourInput.slice(0,2)}:${data.hourInput.slice(2)}` : "",
      lunarDate: data.calType === "음력" ? `${data.year}-${data.month}-${data.day}` : saju.lunarDate,
      solarDate: saju.solarDate
    };
  }, [saju, data]);

  
  const handleAiRequest = async () => {
    try {
      setAiLoading(true);
      setAiError(null);
      setAiInterpretation(""); 
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 🟢 [수정 2] 위에서 선언한 enrichedSaju를 재사용합니다.
        body: JSON.stringify({ saju: enrichedSaju }) 
      });
      
      if (!response.ok) throw new Error("AI 서버와 연결할 수 없습니다.");

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
          setAiInterpretation(currentText); 
        }
      }
      
    } catch (e) {
      setAiError("AI 분석 중 통신 오류가 발생했습니다.");
      setAiLoading(false);
    }
  };


  if (loading) return <div className="text-center pt-20 font-bold text-primary">운명의 흐름을 읽고 있습니다...</div>;
  if (error) return <div className="text-center pt-20 text-red-500">{error}</div>;
  if (!saju || !enrichedSaju) return null;

  return (
    <div className="mx-auto max-w-7xl px-1 pt-14 pb-20">
      
      {/* ... (상단 헤더, 사주 원국, 운의 흐름 부분은 기존과 동일) ... */}
      
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

      <div className="w-full max-w-3xl mx-auto pb-4">
        <SajuTable saju={saju} form={data} />
      </div>

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
          // 🟢 [수정 3] 중복 코드를 제거하고 만들어둔 객체를 넘겨주어 훨씬 깔끔해졌습니다.
          saju={enrichedSaju} 
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