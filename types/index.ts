import { z } from 'zod';

/* ─── Input Validation Schema ─── */
export const AnalyzeInputSchema = z.object({
  userEmail: z.string().optional().default('guest'),
  isCustomUser: z.boolean().optional().default(false),
  aiMode: z.enum(['live', 'demo']).optional().default('live'),
  recipient: z.string().min(1, 'Please select or specify a recipient'),
  situation: z.string().min(1, 'Please select or specify the situation'),
  tone: z.array(z.string()).optional(),
  desiredTone: z.union([z.string(), z.array(z.string())]).optional(),
  context: z.string().max(2000, 'Context cannot exceed 2000 characters').optional().default(''),
  roughMessage: z
    .string()
    .min(10, 'Your draft message must be at least 10 characters long')
    .max(5000, 'Your draft message cannot exceed 5000 characters'),
}).transform((data) => {
  let resolvedTones: string[] = [];
  if (Array.isArray(data.tone) && data.tone.length > 0) {
    resolvedTones = data.tone;
  } else if (Array.isArray(data.desiredTone) && data.desiredTone.length > 0) {
    resolvedTones = data.desiredTone;
  } else if (typeof data.desiredTone === 'string' && data.desiredTone) {
    resolvedTones = [data.desiredTone];
  } else {
    resolvedTones = ['Professional', 'Respectful'];
  }
  return {
    ...data,
    tone: resolvedTones,
  };
});

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

/* ─── AI Response Structured Schema ─── */
export const CommunicationIssueSchema = z.object({
  problem: z.string(),
  why: z.string(),
  suggestion: z.string(),
});

export const AlternativeToneSchema = z.object({
  tone: z.string(),
  message: z.string(),
});

export const ScoresSchema = z.object({
  respect: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  professionalism: z.number().min(0).max(100),
  warmth: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  accountability: z.number().min(0).max(100),
});

export const AnalysisResultSchema = z.object({
  intent: z.string(),
  summary: z.string(),
  overallScore: z.number().min(0).max(100),
  scores: ScoresSchema,
  strengths: z.array(z.string()),
  issues: z.array(CommunicationIssueSchema),
  improvedMessage: z.string(),
  alternatives: z.array(AlternativeToneSchema),
  whyItWorks: z.array(z.string()),
  communicationTips: z.array(z.string()),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/* ─── API Envelope Response ─── */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  isDemo?: boolean;
  error?: string;
}

/* ─── Saved History Item ─── */
export interface HistorySession {
  id: string;
  userEmail?: string | null;
  recipient: string;
  situation: string;
  tone: string[];
  context?: string | null;
  roughMessage: string;
  result: AnalysisResult;
  isDemo: boolean;
  createdAt: string;
}
