import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeInputSchema } from '@/types';
import { analyzeMessage } from '@/lib/aiService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input payload with Zod
    const validation = AnalyzeInputSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid request payload';
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const input = validation.data;

    // Process analysis via Vertex AI or explicit Demo Mode
    const { result, isDemo } = await analyzeMessage(input);

    // Save session in database for registered users (skip for guests unless requested)
    if (input.userEmail && input.userEmail !== 'guest') {
      try {
        await prisma.analysisSession.create({
          data: {
            userEmail: input.userEmail,
            recipient: input.recipient,
            situation: input.situation,
            tone: JSON.stringify(input.tone),
            context: input.context || '',
            roughMessage: input.roughMessage,
            resultJson: JSON.stringify(result),
            isDemo,
          },
        });
      } catch (dbErr) {
        console.warn('[SayItRight] Failed to save session to DB:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      isDemo,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[SayItRight] API POST /api/analyze error:', errorMsg);

    const isAuthError =
      errorMsg.includes('GROQ_API_KEY is not configured') ||
      errorMsg.includes('GROQ_AUTH_FAILED') ||
      errorMsg.includes('GEMINI_AUTH_REQUIRED') ||
      errorMsg.includes('GEMINI_API_KEY_INVALID') ||
      errorMsg.includes('VERTEX_AUTH_REQUIRED') ||
      errorMsg.includes('default credentials');

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        needsAuth: isAuthError,
      },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
