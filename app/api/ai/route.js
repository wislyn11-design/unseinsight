import { generateSajuPrompt } from '../../lib/saju/promptFactory.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// 💡 [핵심 수정 1] 문제가 많던 'edge' 런타임을 완전히 삭제했습니다. (자동으로 가장 안정적인 Node.js 환경으로 작동합니다)
// 💡 [핵심 수정 2] 통신이 끊기지 않도록 여유 시간(maxDuration)을 60초로 넉넉하게 설정합니다.
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
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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