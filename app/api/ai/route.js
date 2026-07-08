import { generateSajuPrompt } from '../../lib/saju/promptFactory.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'edge';
// 💡 Next.js가 응답을 맘대로 캐싱(저장)해서 늦게 보내지 못하도록 강제 설정합니다.
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

    // 💡 [핵심 1] 멈춰서 기다리지 않고, 스트리밍(실시간) 함수를 호출합니다.
    const streamingResp = await model.generateContentStream(finalPrompt);

    // 💡 [핵심 2] 생성되는 글자를 실시간으로 프론트엔드에 쏴주기 위한 호스(Stream)를 연결합니다.
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

    // 💡 [핵심 3] 조립된 스트림 데이터를 즉시 응답으로 내보냅니다.
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