import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import { AnalysisResult, AnalysisResultSchema, AnalyzeInput } from '@/types';

// Say It Right AI Communication Coach System Prompt
const SYSTEM_PROMPT = `You are "Say It Right", an AI communication coach.
Your job is to help users communicate difficult messages clearly, respectfully, confidently, and effectively.
Do not merely rewrite the user's message.

First understand:
- What the user is trying to achieve
- Who they are talking to
- The situation
- The desired tone
- What could go wrong with the current wording

Then analyze the message.

Evaluate:
- Respect
- Clarity
- Professionalism
- Warmth
- Confidence
- Accountability

Explain what is already working.
Identify communication problems.
Explain why those problems matter.
Suggest concrete improvements.
Then produce an improved version.
Also provide genuinely different alternatives.

IMPORTANT RULES:
1. Preserve the user's original intent.
2. Preserve factual information supplied by the user.
3. Never invent excuses.
4. Never invent events.
5. Never invent achievements.
6. Never invent deadlines.
7. Never invent promises.
8. Never manipulate the recipient.
9. Never guilt-trip the recipient.
10. Never shame the user.
11. Do not make every message unnecessarily formal.
12. Do not simply add "Dear Sir" and "Thank you" and call it an improvement.
13. Actually improve the communication.
14. The improved message must be relevant to the current user input.
15. Alternatives must genuinely differ in tone.
16. The AI response must never reuse a previous user's response.
17. Do not output generic advice unrelated to the current message.

All scores must be integers from 0 to 100.

Return ONLY a valid raw JSON object matching the required structure without any markdown formatting or code fences:
{
  "intent": "string",
  "summary": "string",
  "overallScore": 0,
  "scores": {
    "respect": 0,
    "clarity": 0,
    "professionalism": 0,
    "warmth": 0,
    "confidence": 0,
    "accountability": 0
  },
  "strengths": [
    "string"
  ],
  "issues": [
    {
      "problem": "string",
      "why": "string",
      "suggestion": "string"
    }
  ],
  "improvedMessage": "string",
  "alternatives": [
    {
      "tone": "Professional / Formal",
      "message": "string"
    },
    {
      "tone": "Warm & Friendly",
      "message": "string"
    },
    {
      "tone": "Confident & Direct",
      "message": "string"
    },
    {
      "tone": "Diplomatic & Softened",
      "message": "string"
    }
  ],
  "whyItWorks": [
    "string"
  ],
  "communicationTips": [
    "string"
  ]
}`;

// Singleton client instances
let groqClient: Groq | null = null;
let googleGenAIClient: GoogleGenAI | null = null;
let currentGoogleAuth: 'apiKey' | 'vertexai' | null = null;

/**
 * Determine active AI provider based on environment configuration
 */
function getActiveProvider(): 'groq' | 'gemini' | 'vertex' {
  const provider = (process.env.AI_PROVIDER || '').toLowerCase().trim();
  if (provider === 'vertex') return 'vertex';
  if (provider === 'gemini') return 'gemini';
  if (provider === 'groq') return 'groq';

  // Auto-detect based on configured keys - prefer Gemini in AI Studio environment
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_API_KEY_HERE') {
    return 'gemini';
  }
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'YOUR_GROQ_API_KEY_HERE') {
    return 'groq';
  }

  return process.env.GEMINI_API_KEY ? 'gemini' : (process.env.GROQ_API_KEY ? 'groq' : 'gemini');
}

function getGroqClient(): Groq {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') {
    throw new Error('GROQ_API_KEY is not configured. Please set your GROQ_API_KEY in .env.local.');
  }

  if (!groqClient || (groqClient as any).apiKey !== apiKey) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

function getGoogleClient(): { client: GoogleGenAI; isApiKey: boolean } {
  const apiKey = process.env.GEMINI_API_KEY;
  const provider = (process.env.AI_PROVIDER || '').toLowerCase().trim();
  const project = process.env.GOOGLE_CLOUD_PROJECT || '';
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

  if (apiKey && apiKey !== 'YOUR_API_KEY_HERE' && apiKey.trim() !== '') {
    if (!googleGenAIClient || currentGoogleAuth !== 'apiKey') {
      googleGenAIClient = new GoogleGenAI({ apiKey });
      currentGoogleAuth = 'apiKey';
    }
    return { client: googleGenAIClient, isApiKey: true };
  }

  if (provider === 'vertex' && project) {
    if (!googleGenAIClient || currentGoogleAuth !== 'vertexai') {
      googleGenAIClient = new GoogleGenAI({
        vertexai: true,
        project,
        location,
      });
      currentGoogleAuth = 'vertexai';
    }
    return { client: googleGenAIClient, isApiKey: false };
  }

  if (!googleGenAIClient || currentGoogleAuth !== 'apiKey') {
    googleGenAIClient = new GoogleGenAI({});
    currentGoogleAuth = 'apiKey';
  }

  return { client: googleGenAIClient, isApiKey: true };
}

/**
 * Curated static benchmark responses strictly for DEMO MODE presentation
 */
export function getCuratedDemoResponse(input: AnalyzeInput): AnalysisResult {
  const lowerMsg = input.roughMessage.toLowerCase();

  if (lowerMsg.includes('raise') || lowerMsg.includes('salary') || lowerMsg.includes('15%')) {
    return {
      intent: 'Request a compensation review and 15% salary adjustment based on annual performance.',
      summary: 'Your draft states your salary objective directly, but demanding a raise without framing it around delivered business value can trigger defensiveness.',
      overallScore: 62,
      scores: {
        respect: 65,
        clarity: 85,
        professionalism: 58,
        warmth: 55,
        confidence: 80,
        accountability: 70,
      },
      strengths: [
        'You clearly stated your target adjustment of 15%.',
        'You referenced your effort over the past year.',
        'You identified an upcoming timeline milestone.'
      ],
      issues: [
        {
          problem: '"Give me a 15% raise"',
          why: 'Issuing a direct demand rather than proposing a performance discussion can make leadership defensive.',
          suggestion: 'Propose a structured 1:1 to review your accomplishments and discuss aligning your compensation.'
        },
        {
          problem: '"inflation is high"',
          why: 'Organizations adjust compensation based on business impact and market benchmarks rather than personal cost-of-living increases.',
          suggestion: 'Focus on expanded responsibilities and results delivered over the past cycle.'
        }
      ],
      improvedMessage: 'Dear [Manager Name],\n\nI hope you are having a productive week. Ahead of the upcoming review cycle and holiday season, I would welcome the opportunity to schedule a brief meeting to discuss my compensation and recent contributions.\n\nOver the past year, I have taken on substantial responsibilities and consistently delivered quality results. In light of this expanded scope and market benchmarks, I would like to propose aligning my salary with a 15% compensation adjustment.\n\nCould we set aside 15 to 20 minutes next week to review my performance together? Thank you for your leadership and continuous support.\n\nBest regards,',
      alternatives: [
        {
          tone: 'Professional / Formal',
          message: 'Dear [Manager Name],\n\nI am writing to formally request a compensation review meeting. Over the recent performance cycle, I have expanded my core responsibilities and delivered on critical deliverables.\n\nI would appreciate the opportunity to discuss adjusting my salary to reflect these contributions, with a target increase of 15%.\n\nI welcome the opportunity to present my review summary at your earliest convenience. Thank you for your consideration.\n\nSincerely,'
        },
        {
          tone: 'Warm & Friendly',
          message: "Hi [Manager Name],\n\nI hope your week is going great! With our upcoming review season approaching, I'd love to grab 15 minutes with you to chat about my growth and compensation.\n\nI've loved taking on more ownership this year, and I'd be thrilled to discuss aligning my pay with a 15% compensation adjustment to reflect that progress. Let me know when works best for you!\n\nBest,"
        },
        {
          tone: 'Confident & Direct',
          message: 'Hi [Manager Name],\n\nI would like to schedule a dedicated 1:1 next week to discuss aligning my compensation with the value and expanded impact I have delivered this year.\n\nBased on my key achievements and market alignment, I am proposing a 15% compensation adjustment. I look forward to walking through my contributions and finding a mutual path forward.\n\nBest regards,'
        },
        {
          tone: 'Diplomatic & Softened',
          message: 'Hi [Manager Name],\n\nI hope you are doing well. I would greatly appreciate your guidance and perspective on my current compensation trajectory as we near our annual review.\n\nGiven the responsibilities I have managed recently, I would love to explore a performance-aligned adjustment of 15%. Could we schedule a brief sync to discuss this openly?\n\nThank you for your time and thoughtful leadership.'
        }
      ],
      whyItWorks: [
        'It converts an abrupt demand into a high-leverage business discussion.',
        'It grounds the request in accomplishments and value rather than personal pressure.',
        'It preserves your exact target of 15% while inviting mutual collaboration.'
      ],
      communicationTips: [
        'When negotiating compensation, focus the conversation on demonstrated impact and future alignment rather than personal living expenses.'
      ]
    };
  }

  if (lowerMsg.includes('bug') || lowerMsg.includes('cannot help') || lowerMsg.includes('figure it out')) {
    return {
      intent: 'Decline additional bug triage tasks due to conflicting project deadlines.',
      summary: 'Your intention to protect your capacity is legitimate, but telling a colleague to "figure it out yourself" damages working relationships and team trust.',
      overallScore: 50,
      scores: {
        respect: 40,
        clarity: 90,
        professionalism: 45,
        warmth: 40,
        confidence: 85,
        accountability: 70,
      },
      strengths: [
        'Your boundary is unambiguous.',
        'You recognized your own deadline obligations.'
      ],
      issues: [
        {
          problem: '"Figure it out yourself"',
          why: 'This phrasing is dismissive and aggressive, creating unnecessary friction with colleagues.',
          suggestion: 'Politely redirect them to team triage channels or documentation.'
        }
      ],
      improvedMessage: `Hello [Colleague Name],\n\nThank you for reaching out. I would normally be glad to assist, but my bandwidth is currently fully committed to our scheduled deliverables and I won't be able to take on the bug resolution tasks right now.\n\nI want to make sure I don't compromise the quality of our immediate commitments. I recommend checking in with the team lead or syncing during our next standup to reallocate these items.\n\nThank you for understanding, and let me know if there's anything we should coordinate once my current milestone is complete.\n\nBest regards,`,
      alternatives: [
        {
          tone: 'Professional / Formal',
          message: 'Hello [Colleague Name],\n\nThank you for checking in with me. Due to current project obligations and upcoming deadlines, I am unable to take on the bug resolution tasks at this time.\n\nTo ensure our team commitments remain on track, I suggest reallocating these responsibilities or raising them in our next sprint triage. Thank you for your understanding.\n\nSincerely,'
        },
        {
          tone: 'Warm & Friendly',
          message: "Hi [Name],\n\nThanks for reaching out! I'd love to help, but my plate is completely full with our current deliverables right now, so I won't be able to jump in on the bug resolution tasks.\n\nI hope the rest of the team can help get those sorted, and let's definitely catch up once these deadlines clear up!\n\nBest,"
        },
        {
          tone: 'Confident & Direct',
          message: 'Hi [Name],\n\nI am currently fully booked on our primary deliverables, so I will not be able to assist with the bug resolution tasks right now.\n\nI need to protect my capacity to ensure our scheduled targets are met without delay. Please coordinate with the rest of the team to find available support.\n\nBest regards,'
        },
        {
          tone: 'Diplomatic & Softened',
          message: 'Hi [Name],\n\nI appreciate you bringing this to my attention. Given our upcoming milestones, taking on the bug resolution tasks right now would risk the delivery of my current commitments.\n\nCould we bring this up in our team check-in to see who has capacity to take this on? I appreciate your understanding as we balance our workload.'
        }
      ],
      whyItWorks: [
        'It sets a firm boundary without being confrontational.',
        'It explains bandwidth constraints in terms of project success.',
        'It offers constructive redirection instead of dismissive hostility.'
      ],
      communicationTips: [
        'Setting healthy workplace boundaries is about protecting project quality and capacity, not refusing collaboration.'
      ]
    };
  }

  // Default benchmark scenario: Extension request
  return {
    intent: `Request an academic extension for ${input.situation.toLowerCase()} from ${input.recipient}.`,
    summary: 'Your draft communicates the core need for more time, but framing the reason around general competing work can suggest poor planning.',
    overallScore: 72,
    scores: {
      respect: 75,
      clarity: 80,
      professionalism: 70,
      warmth: 65,
      confidence: 70,
      accountability: 68,
    },
    strengths: [
      'The request for an extension is upfront.',
      'The requested timeline is clear.'
    ],
    issues: [
      {
        problem: '"I was busy with other work"',
        why: 'Mentioning competing coursework to an instructor can imply their class was not prioritized.',
        suggestion: 'Focus on your commitment to thorough work and propose a concrete completion date.'
      }
    ],
    improvedMessage: 'Dear Professor [Last Name],\n\nI am writing regarding the upcoming assignment submission. I am deeply dedicated to submitting thorough, high-quality work that meets full course standards.\n\nDue to unexpected scheduling constraints, I would be grateful for a brief extension of 2 days to ensure my submission is rigorous and complete.\n\nWould it be possible to submit by Friday? Thank you very much for your time, consideration, and guidance.\n\nBest regards,',
    alternatives: [
      {
        tone: 'Professional / Formal',
        message: 'Dear Professor [Last Name],\n\nI am writing to formally request a 2-day extension for the assignment due tonight. In order to ensure that my work is thorough and meets all requirements, additional time is needed to finalize the project.\n\nThank you for your consideration and understanding.\n\nSincerely,'
      },
      {
        tone: 'Warm & Friendly',
        message: "Hi Professor,\n\nI hope your week is going well! I'm currently working through the assignment and realized I could really use a couple of extra days to polish everything properly.\n\nWould it be alright if I turned this in on Friday? Thanks so much for your flexibility!\n\nBest regards,"
      },
      {
        tone: 'Confident & Direct',
        message: 'Dear Professor [Last Name],\n\nI am writing to request a 2-day extension for the assignment. To ensure the submission meets the highest academic standard, I will have the completed work ready by Friday.\n\nThank you for your support.\n\nBest regards,'
      },
      {
        tone: 'Diplomatic & Softened',
        message: 'Dear Professor [Last Name],\n\nI hope this message finds you well. I would appreciate your guidance regarding the deadline for our assignment.\n\nTo avoid compromising on quality due to unforeseen scheduling overlap, would you be open to an extension of 2 days? I am committed to delivering solid work and appreciate your consideration.\n\nBest regards,'
      }
    ],
    whyItWorks: [
      'It takes accountability without offering vague excuses.',
      'It states a concrete timeline rather than an open-ended delay.',
      'It emphasizes commitment to course quality.'
    ],
    communicationTips: [
      'When asking for an extension, acknowledge the deadline, provide a clear target date, and emphasize your commitment to quality work.'
    ]
  };
}

/**
 * Execute Groq AI call with structured JSON response
 */
async function callGroqAI(userPrompt: string, modelName: string): Promise<AnalysisResult> {
  const groq = getGroqClient();

  console.log('[AI] Groq request started');
  const startTime = Date.now();

  let chatCompletion;
  try {
    chatCompletion = await groq.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('model_not_found') || msg.includes('does not exist') || msg.includes('do not have access')) {
      console.warn(`[AI] Model ${modelName} not available on this Groq key, falling back to openai/gpt-oss-120b...`);
      chatCompletion = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });
    } else {
      throw err;
    }
  }

  const duration = Date.now() - startTime;
  console.log(`[AI] Groq response received (${duration}ms)`);

  const rawContent = chatCompletion.choices[0]?.message?.content || '';
  if (!rawContent) {
    throw new Error('GROQ_EMPTY_RESPONSE: Groq returned an empty response.');
  }

  const cleanJson = rawContent
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (parseErr) {
    throw new Error(`GROQ_JSON_PARSE_ERROR: Failed to parse Groq response as JSON: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
  }

  // Normalize scores to ensure integer 0-100 scale
  if (typeof parsed.overallScore === 'number') {
    parsed.overallScore = parsed.overallScore <= 10 
      ? Math.round(parsed.overallScore * 10) 
      : Math.round(parsed.overallScore);
  }
  if (parsed.scores && typeof parsed.scores === 'object' && parsed.scores !== null) {
    for (const [k, v] of Object.entries(parsed.scores)) {
      if (typeof v === 'number') {
        parsed.scores[k] = v <= 10 ? Math.round(v * 10) : Math.round(v);
      }
    }
  }

  const validated = AnalysisResultSchema.parse(parsed);
  console.log('[AI] Response validation successful');
  return validated;
}

/**
 * Primary AI analysis function supporting Groq, Gemini API, and Vertex AI.
 */
export async function analyzeMessage(input: AnalyzeInput): Promise<{ result: AnalysisResult; isDemo: boolean }> {
  // 1. Explicit Demo Mode (ONLY when explicitly chosen by user via UI demo selector)
  if (input.aiMode === 'demo') {
    console.log('[AI] Demo mode requested. Returning curated benchmark response.');
    return { result: getCuratedDemoResponse(input), isDemo: true };
  }

  const provider = getActiveProvider();
  console.log('[AI] Request received');
  console.log(`[AI] Provider: ${provider === 'groq' ? 'Groq' : provider === 'gemini' ? 'Gemini API' : 'Vertex AI'}`);

  const userPrompt = `RECIPIENT: ${input.recipient}
SITUATION: ${input.situation}
DESIRED TONE: ${input.tone.join(', ')}
ADDITIONAL CONTEXT: ${input.context || 'None provided'}
ROUGH MESSAGE TO REWRITE AND ANALYZE:
"""
${input.roughMessage}
"""

COACHING MANDATE:
- Understand the user's intent, recipient, and situation.
- Evaluate respect, clarity, professionalism, warmth, confidence, accountability.
- Explain strengths and communication problems (why they matter, suggestions).
- Produce an improved version that preserves facts and intent without inventing excuses.
- Provide 4 distinct tone alternatives (e.g. Professional / Formal, Warm & Friendly, Confident & Direct, Diplomatic & Softened, or Romantic & Loving if Love tone is requested).
- If "Love" is among the desired tones, craft the messages with deep emotional warmth, tenderness, heartfelt sincerity, and loving care suitable for a partner, spouse, or loved one.
- All scores must be integers between 0 and 100.`;

  // === 1. GROQ PROVIDER ===
  if (provider === 'groq') {
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    console.log(`[AI] Model: ${model}`);

    try {
      const result = await callGroqAI(userPrompt, model);

      // Verify that AI did not echo back the rough message
      if (
        !result.improvedMessage ||
        result.improvedMessage.trim().toLowerCase() === input.roughMessage.trim().toLowerCase()
      ) {
        throw new Error('AI generated response was identical to original input.');
      }

      return { result, isDemo: false };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[AI] Groq request failed:', errorMsg);

      if (errorMsg.includes('GROQ_API_KEY is not configured')) {
        throw new Error('GROQ_API_KEY is not configured. Please set your GROQ_API_KEY in .env.local.');
      }
      if (
        errorMsg.includes('401') ||
        errorMsg.includes('Invalid API Key') ||
        errorMsg.includes('model_not_found') ||
        errorMsg.includes('you do not have access to it')
      ) {
        throw new Error('GROQ_AUTH_FAILED: Invalid or unconfigured GROQ_API_KEY. Please set your valid key from https://console.groq.com/keys in .env.local.');
      }
      if (errorMsg.includes('429') || errorMsg.includes('rate_limit')) {
        throw new Error('GROQ_RATE_LIMITED: Groq API rate limit reached. Please wait a moment and try again.');
      }

      throw new Error(`AI_CALL_FAILED: ${errorMsg}`);
    }
  }

  // === 2. GOOGLE GEMINI / VERTEX AI PROVIDER ===
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const project = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0717397923';
  const { client, isApiKey } = getGoogleClient();
  const startTime = Date.now();

  console.log(`[AI] Google Client Auth: ${isApiKey ? 'Google AI Studio API Key' : `Vertex AI (${project})`}`);
  console.log(`[AI] Model: ${modelName}`);

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out after 25 seconds')), 25000)
    );

    const callWithRetry = async () => {
      try {
        return await client.models.generateContent({
          model: modelName,
          contents: `${SYSTEM_PROMPT}\n\nUSER INPUT:\n${userPrompt}`,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.35,
          },
        });
      } catch (firstErr: unknown) {
        const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
        if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
          console.warn('[Say It Right] Transient 503 received, retrying in 1200ms...');
          await new Promise((resolve) => setTimeout(resolve, 1200));
          return await client.models.generateContent({
            model: modelName,
            contents: `${SYSTEM_PROMPT}\n\nUSER INPUT:\n${userPrompt}`,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.35,
            },
          });
        }
        throw firstErr;
      }
    };

    const apiPromise = callWithRetry();
    const response = (await Promise.race([apiPromise, timeoutPromise])) as { text?: string };
    const rawText = response.text || '';
    const latency = Date.now() - startTime;

    console.log(`[AI] Response received (latency: ${latency}ms)`);

    const jsonText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(jsonText);

    if (typeof parsed.overallScore === 'number') {
      parsed.overallScore = parsed.overallScore <= 10 
        ? Math.round(parsed.overallScore * 10) 
        : Math.round(parsed.overallScore);
    }
    if (parsed.scores && typeof parsed.scores === 'object') {
      for (const [k, v] of Object.entries(parsed.scores)) {
        if (typeof v === 'number') {
          parsed.scores[k] = v <= 10 ? Math.round(v * 10) : Math.round(v);
        }
      }
    }

    const validatedResult = AnalysisResultSchema.parse(parsed);

    if (
      !validatedResult.improvedMessage ||
      validatedResult.improvedMessage.trim() === input.roughMessage.trim()
    ) {
      throw new Error('AI generated response was identical to original input.');
    }

    console.log('[AI] Response validation successful');
    return { result: validatedResult, isDemo: false };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[AI] Google AI error:', errorMsg);

    if (
      errorMsg.includes('default credentials') ||
      errorMsg.includes('UNAUTHENTICATED') ||
      errorMsg.includes('Could not load the default credentials')
    ) {
      throw new Error(
        'VERTEX_AUTH_REQUIRED: Google Cloud Vertex AI credentials not found. Run "gcloud auth application-default login" for local development, or deploy to Google Cloud Run with Service Account identity.'
      );
    }

    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key not valid')) {
      throw new Error(
        'GEMINI_API_KEY_INVALID: The GEMINI_API_KEY provided in .env.local is not valid. Please check your key at https://aistudio.google.com/apikey'
      );
    }

    if (errorMsg.includes('PERMISSION_DENIED') || errorMsg.includes('not enabled')) {
      throw new Error(
        `GEMINI_PERMISSION_DENIED: Permission was denied or the API is not enabled for project "${project}".`
      );
    }

    throw new Error(`AI_CALL_FAILED: ${errorMsg}`);
  }
}
