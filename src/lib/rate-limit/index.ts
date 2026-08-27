import { NextRequest } from 'next/server';

// Simple in-memory rate limiter
// In production, use Redis (e.g., @upstash/ratelimit)

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
// Store interval ID to clear on hot reload (HMR)
const cleanupIntervalId = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

if (typeof globalThis !== 'undefined') {
  const g = globalThis as unknown as { __rateLimitCleanup?: NodeJS.Timeout };
  if (g.__rateLimitCleanup) clearInterval(g.__rateLimitCleanup);
  g.__rateLimitCleanup = cleanupIntervalId;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
}

export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator } = config;

  return {
    check: (req: NextRequest): { allowed: boolean; remaining: number; resetAt: number } => {
      const key = keyGenerator ? keyGenerator(req) : getDefaultKey(req);
      const now = Date.now();
      const resetAt = now + windowMs;

      const entry = rateLimitMap.get(key);

      if (!entry || entry.resetAt < now) {
        rateLimitMap.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: maxRequests - 1, resetAt };
      }

      if (entry.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
      }

      entry.count++;
      return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
    },
  };
}

function getDefaultKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  return ip;
}

// Pre-configured rate limiters
export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
});

export const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 15,
});

export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
});

export function rateLimitResponse(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return Response.json(
    { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(resetAt),
      },
    }
  );
}
