import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { saju } = await request.json();

    const prompt = "당신은 30년 경력의 사주 전문가입니다. " +
      "연주: " + saju.year.gan + saju.year.ji + ", " +
      "월주: " + saju.month.gan + saju.month.ji + ", " +
      "일주: " + saju.day.gan + saju.day.ji + ", " +
      "시주: " + saju.hour.gan + saju.hour.ji + ". " +
      "이 사주를 1.일주분석 2.전반운세 3.올해운 4.조언 순서로 풀이해주세요.";

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('AI 응답 없음');
    return NextResponse.json({ success: true, result: text });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}