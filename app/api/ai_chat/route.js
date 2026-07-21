import { GoogleGenAI } from "@google/genai";
import fs from 'fs'; // 👈 1. 파일 모듈 fs를 추가했습니다!
import path from 'path';

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { saju, userMessage } = await request.json();

    // 💡 [Vercel & 로컬 자동 분기 처리]
    let keyFilePath;

    if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
      // Vercel 환경일 때: 환경변수 텍스트로 임시 키파일 생성
      keyFilePath = path.join('/tmp', 'service-account-key.json');
      fs.writeFileSync(keyFilePath, process.env.GCP_SERVICE_ACCOUNT_KEY);
    } else {
      // 로컬 개발 환경일 때
      keyFilePath = path.join(process.cwd(), 'config', 'service-account-key.json');
    }

    // 최종 적용!
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilePath;

    const finalPrompt = `
    당신은 핵심만 빠르고 정확하게 짚어주는 명리학 상담사입니다.
    아래 고객의 사주 원국 데이터를 바탕으로 질문에 답변해 주세요.
    
    [고객 사주 데이터]
    ${JSON.stringify(saju)}
    
    [고객 질문]
    "${userMessage}"
    
    [작성 지시사항 - 매우 중요]
    1. 분량 제한: 전체 답변은 반드시 3~5줄 이내로 아주 짧고 명결하게 작성하세요.
    2. 서론 금지: "안녕하세요", "사주를 분석해 드리겠습니다", "질문에 답변 드리겠습니다" 같은 불필요한 인사말이나 도입부는 절대 쓰지 마세요. 첫 문장부터 즉시 질문에 대한 대답으로 시작하세요.
    3. 쉬운 풀이: 사주 전문 용어(십성, 합충 변화 등)를 늘어놓지 말고, 일반인이 이해하기 쉬운 결과 위주의 일상어로 답하세요.
    4. 요약 마무리: 답변의 맨 마지막 줄에는 "**결론:**" 이라는 단어로 시작하는 명확한 행동 지침(한 줄 요약)을 추가하세요.
    `;

    // 👈 2. 예전에 남아있던 중복 keyFilePath 설정 두 줄을 깔끔하게 제거했습니다!

    const ai = new GoogleGenAI({
      vertexai: {
        project: '906229574147',
        location: 'us-central1',
      },
      project: '906229574147',
      location: 'us-central1',
    });

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 0, 
        }
      }
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          controller.close();
        } catch (err) {
          console.error("스트리밍 중 에러:", err);
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("AI API 에러:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}