import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export const runtime = 'edge'; 
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { saju, gender } = await request.json();
    
    console.log("받은 사주 데이터:", saju); 

    if (!saju || !saju.year || !saju.month || !saju.day) {
      throw new Error("사주 데이터가 불완전합니다.");
    }

    const year = `${saju.year.gan}${saju.year.ji}`;
    const month = `${saju.month.gan}${saju.month.ji}`;
    const day = `${saju.day.gan}${saju.day.ji}`;
    const hour = `${saju.hour.gan}${saju.hour.ji}`;

    const prompt = `
      당신은 30년 경력의 지혜롭고 따뜻한 명리학 전문가입니다.
      아래 제공된 사용자의 사주 원국 데이터를 바탕으로, 이 사람의 타고난 기질과 운명의 큰 테마를 분석하는 '사주 총론'을 작성해 주세요.

      [출력 규칙]
      1. 대운, 세운, 월운, 신살에 대한 이야기는 절대 하지 마세요. 오직 사주 원국(8글자)의 오행 분포와 십성의 특징만으로 분석하세요.
      2. 전체 분량은 3문단으로 작성하고, 각 문단 앞에는 내용에 맞는 [소제목]을 달아주세요.
      3. 전문 용어(비견, 상관 등)를 쓰되 일반인도 이해하기 쉽도록 따뜻하고 긍정적인 톤으로 설명해 주세요.

      [사용자 데이터]
      성별: ${gender || '알 수 없음'}
      년주: ${year} / 월주: ${month} / 일주: ${day} / 시주: ${hour}
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ summary: responseText });

  } catch (error) {
    console.error('총론 생성 중 오류 발생:', error);
    return NextResponse.json({ error: '사주 총론을 불러오는 데 실패했습니다.' }, { status: 500 });
  }
}