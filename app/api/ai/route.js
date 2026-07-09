import { generateSajuPrompt } from '../../lib/saju/promptFactory.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60; 
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
    
    // 💡 [선생님이 찾아내신 완벽한 해결책 적용] 
    // AI가 뜸 들이지 않고 즉시 첫 글자를 뱉어내도록 강제합니다.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        thinkingConfig: {
          thinkingBudget: 0, 
        },
      },
    });

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