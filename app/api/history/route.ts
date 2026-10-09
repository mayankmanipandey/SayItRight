import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HistorySession } from '@/types';

// Pre-seeded sessions for registered demo accounts if database is empty
const PRESEEDED_STUDENT_SESSIONS: HistorySession[] = [
  {
    id: 'demo-student-1',
    userEmail: 'alex@student.edu',
    recipient: 'Professor',
    situation: 'Assignment Extension',
    tone: ['Respectful', 'Professional'],
    context: 'CS 101 Midterm Project due tonight',
    roughMessage: "Sir I couldn't submit the assignment because I was busy with other work. Please give me 2 more days.",
    result: {
      intent: 'Requesting assistance regarding assignment extension from Professor in a Respectful, Professional manner.',
      summary: 'Your request is clear, but the explanation could sound defensive and show more accountability.',
      overallScore: 7.2,
      scores: { respect: 7.5, clarity: 8.0, professionalism: 7.0, warmth: 6.5, confidence: 7.0, accountability: 6.5 },
      strengths: ['Core request is clear and direct.', 'Stated situation upfront.'],
      issues: [{ problem: 'busy with other work', why: 'May sound like the assignment was not your top priority.', suggestion: 'Focus on your commitment to quality work.' }],
      improvedMessage: 'Dear Professor,\n\nI am writing to request a 2-day extension for the CS 101 Midterm Project. Due to unexpected scheduling constraints, I want to ensure sufficient time to deliver quality work.\n\nThank you for your consideration.\n\nBest regards,\nAlex',
      alternatives: [
        { tone: 'Professional', message: 'Dear Professor,\n\nI hope you are well. I am reaching out to request a brief extension on the CS 101 Midterm Project...' },
        { tone: 'Friendly', message: 'Hi Professor,\n\nI hope your week is going well! I am working on the CS 101 assignment and could use extra time...' },
        { tone: 'Confident', message: 'Dear Professor,\n\nI am writing to update you on my progress with the CS 101 Midterm Project...' }
      ],
      whyItWorks: ['Takes responsibility without over-explaining.', 'Makes a specific polite request.'],
      communicationTips: ['State your timeline clearly and explain situation briefly without sounding defensive.']
    },
    isDemo: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

const PRESEEDED_WORK_SESSIONS: HistorySession[] = [
  {
    id: 'demo-work-1',
    userEmail: 'sarah@company.com',
    recipient: 'Manager / Boss',
    situation: 'Raising an Issue or Disagreement',
    tone: ['Professional', 'Confident'],
    context: 'Annual review meeting next week',
    roughMessage: 'I think I deserve a raise because I worked hard this year and inflation is high. Give me a 15% raise.',
    result: {
      intent: 'Requesting a performance-based salary review from Manager in a Professional, Confident manner.',
      summary: 'Your goal is clear, but demanding a specific percentage without citing deliverables sounds abrupt.',
      overallScore: 7.0,
      scores: { respect: 7.0, clarity: 8.5, professionalism: 6.5, warmth: 6.0, confidence: 8.0, accountability: 7.0 },
      strengths: ['Clear intention regarding compensation review.', 'Confident posture.'],
      issues: [{ problem: 'Give me a 15% raise', why: 'Demanding salary increases directly can trigger manager resistance.', suggestion: 'Frame as a performance discussion backed by impact.' }],
      improvedMessage: 'Hi Manager,\n\nAs we approach my annual review, I would appreciate the opportunity to discuss my contributions over the past year and review my compensation alignment.\n\nThank you for your leadership.\n\nBest,\nSarah',
      alternatives: [
        { tone: 'Professional', message: 'Dear Manager,\n\nI am writing to request a meeting to discuss my role, expanded responsibilities, and market rate alignment...' },
        { tone: 'Friendly', message: 'Hi Manager,\n\nHope you have a great week! I\'d love to schedule a quick chat during our 1-on-1 to discuss career growth...' },
        { tone: 'Confident', message: 'Hi Manager,\n\nOver the past year, I led 3 major launches. I\'d like to schedule a compensation review during our next check-in...' }
      ],
      whyItWorks: ['Frames the request as a collaborative discussion.', 'Focuses on value and professional contributions.'],
      communicationTips: ['Anchor salary requests in tangible business impact and schedule dedicated review time.']
    },
    isDemo: true,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || 'guest';

    // Guest users do not have persistent history
    if (userEmail === 'guest') {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const sessions = await prisma.analysisSession.findMany({
      where: { userEmail },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    let formatted: HistorySession[] = sessions.map((s: any) => ({
      id: s.id,
      userEmail: s.userEmail,
      recipient: s.recipient,
      situation: s.situation,
      tone: typeof s.tone === 'string' ? JSON.parse(s.tone || '[]') : s.tone,
      context: s.context,
      roughMessage: s.roughMessage,
      result: typeof s.resultJson === 'string' ? JSON.parse(s.resultJson) : s.resultJson,
      isDemo: s.isDemo,
      createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : (typeof s.createdAt === 'string' ? s.createdAt : new Date(s.createdAt).toISOString()),
    }));

    // If database history is empty for pre-registered demo accounts, return pre-seeded sessions
    if (formatted.length === 0) {
      if (userEmail === 'alex@student.edu') {
        formatted = PRESEEDED_STUDENT_SESSIONS;
      } else if (userEmail === 'sarah@company.com') {
        formatted = PRESEEDED_WORK_SESSIONS;
      }
    }

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('[SayItRight] API GET /api/history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch history.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('userEmail');
    const clearAll = searchParams.get('all') === 'true';

    if (clearAll) {
      if (userEmail) {
        await prisma.analysisSession.deleteMany({ where: { userEmail } });
      } else {
        await prisma.analysisSession.deleteMany({});
      }
      return NextResponse.json({
        success: true,
        message: 'History cleared',
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required for deletion' },
        { status: 400 }
      );
    }

    // Ignore pre-seeded static IDs
    if (!id.startsWith('demo-')) {
      await prisma.analysisSession.delete({
        where: { id },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('[SayItRight] API DELETE /api/history error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete history session.',
      },
      { status: 500 }
    );
  }
}
