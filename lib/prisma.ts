import { PrismaClient } from '@prisma/client';

// In-memory fallback store for ephemeral / disconnected environments
const inMemorySessions: Array<{
  id: string;
  userEmail: string;
  recipient: string;
  situation: string;
  tone: string;
  context: string | null;
  roughMessage: string;
  resultJson: string;
  isDemo: boolean;
  createdAt: Date;
}> = [];

const inMemoryAnalysisSession = {
  findMany: async (args?: any) => {
    let list = [...inMemorySessions];
    if (args?.where?.userEmail) {
      list = list.filter((s) => s.userEmail === args.where.userEmail);
    }
    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (args?.take) {
      list = list.slice(0, args.take);
    }
    return list;
  },
  findFirst: async () => null,
  findUnique: async () => null,
  create: async (args: { data: any }) => {
    const data = args?.data || {};
    const item = {
      id: data.id || `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userEmail: data.userEmail || 'guest',
      recipient: data.recipient || '',
      situation: data.situation || '',
      tone: data.tone || '[]',
      context: data.context || null,
      roughMessage: data.roughMessage || '',
      resultJson: data.resultJson || '{}',
      isDemo: Boolean(data.isDemo),
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    };
    inMemorySessions.unshift(item);
    return item;
  },
  delete: async (args: { where: { id: string } }) => {
    const idx = inMemorySessions.findIndex((s) => s.id === args?.where?.id);
    if (idx !== -1) inMemorySessions.splice(idx, 1);
    return {};
  },
  deleteMany: async (args?: { where?: { userEmail?: string } }) => {
    if (args?.where?.userEmail) {
      const email = args.where.userEmail;
      for (let i = inMemorySessions.length - 1; i >= 0; i--) {
        if (inMemorySessions[i].userEmail === email) inMemorySessions.splice(i, 1);
      }
    } else {
      inMemorySessions.length = 0;
    }
    return { count: 0 };
  },
};

const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    return {
      analysisSession: inMemoryAnalysisSession,
      $connect: async () => {},
      $disconnect: async () => {},
    };
  }

  let realPrisma: any;
  try {
    realPrisma = new PrismaClient();
  } catch {
    console.warn('[AI Studio] PrismaClient initialization failed — using in-memory mock');
    return {
      analysisSession: inMemoryAnalysisSession,
      $connect: async () => {},
      $disconnect: async () => {},
    };
  }

  return new Proxy(realPrisma, {
    get(target, prop, receiver) {
      if (prop === 'analysisSession') {
        const originalSession = target.analysisSession;
        if (!originalSession) return inMemoryAnalysisSession;
        return new Proxy(originalSession, {
          get(sTarget, sProp) {
            const origMethod = sTarget[sProp];
            if (typeof origMethod !== 'function') return origMethod;
            return async (...args: any[]) => {
              try {
                return await origMethod.apply(sTarget, args);
              } catch (dbErr) {
                console.warn(`[AI Studio] Prisma ${String(sProp)} failed, using in-memory fallback:`, dbErr);
                const fallbackMethod = (inMemoryAnalysisSession as any)[sProp];
                if (typeof fallbackMethod === 'function') {
                  return await fallbackMethod(...args);
                }
                return null;
              }
            };
          },
        });
      }
      return Reflect.get(target, prop, receiver);
    },
  });
};

const globalForPrisma = globalThis as unknown as { prisma: any };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

