import { generateSajuPrompt } from '../../lib/saju/promptFactory.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

// 💡 [핵심 1] Vercel의 10초 셧다운을 막아주는 Edge 런타임 강제 설정! (반드시 파일 최상단에 있어야 합니다)
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 💡 [핵심 2] 10초를 기다리지 않고, AI가 글자를 생성하는 즉시 스트리밍으로 쏴줍니다!
    const streamingResp = await model.generateContentStream(finalPrompt);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamingResp.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
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