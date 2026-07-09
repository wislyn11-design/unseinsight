import { generateSajuPrompt } from '../../lib/saju/promptFactory.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { saju, userMessage } = await request.json();
    const systemPrompt = generateSajuPrompt(saju);

    let finalPrompt = systemPrompt;
    if (userMessage) {
      finalPrompt = `${systemPrompt}\n\n[추가 지시사항]\n위의 기본 분석 대신, 다음 사용자의 질문에만 집중하여 명리학에 근거해 친절하게 답변해 주십시오.\n사용자 질문: "${userMessage}"`;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // 💡 [수정 1] 오타가 있었던 모델명을 가장 빠르고 안정적인 최신 Flash 모델로 명확히 수정합니다.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    const streamingResp = await model.generateContentStream(finalPrompt);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamingResp.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

    // 💡 [수정 2] Vercel 프록시의 '강제 버퍼링'을 무력화하는 강력한 헤더 속성들을 추가합니다.
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform', // 프록시가 중간에서 데이터를 압축하거나 모아두지 못하게 차단
        'X-Content-Type-Options': 'nosniff', // 브라우저가 버퍼링 없이 즉시 스트림을 읽도록 강제
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