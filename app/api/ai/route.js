import { GoogleGenAI } from "@google/genai";
import { generateSajuPrompt } from '../../lib/saju/promptFactory.js';
import fs from 'fs'; // 👈 파일을 읽고 쓰는 모듈(fs) 추가
import path from 'path';

// Next.js에서 스트리밍이 끊기지 않도록 강제 설정
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { saju } = await request.json();

    // 👇👇👇 [Vercel & 로컬 환경 자동 분기] 👇👇👇
    let keyFilePath;

    // 1. Vercel 환경일 때 (설정해둔 환경 변수가 존재하면)
    if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
      // Vercel 금고의 텍스트를 꺼내서 서버 임시 폴더(/tmp)에 몰래 파일로 만듭니다.
      keyFilePath = path.join('/tmp', 'service-account-key.json');
      fs.writeFileSync(keyFilePath, process.env.GCP_SERVICE_ACCOUNT_KEY);
    } 
    // 2. 선생님의 컴퓨터(로컬) 환경일 때
    else {
      // 기존 방식대로 내 컴퓨터의 파일을 사용합니다.
      keyFilePath = path.join(process.cwd(), 'config', 'service-account-key.json');
    }

    // 최종 적용!
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilePath;
    // 👆👆👆 -------------------------------------- 👆👆👆

    // 💡 (여기에 남아있던 예전 2줄의 코드를 깔끔하게 삭제했습니다!)

    const ai = new GoogleGenAI({
      vertexai: { project: '906229574147', location: 'us-central1' },
      project: '906229574147', location: 'us-central1',
    });

    // 💡 1. 한 번에 받는 generateContent가 아니라, 실시간으로 쏘는 generateContentStream 사용!
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: generateSajuPrompt(saju),
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

    // 💡 2. JSON 상자가 아닌, Text 스트림 형태로 프론트엔드에 응답합니다.
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("최종 호출 에러:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}