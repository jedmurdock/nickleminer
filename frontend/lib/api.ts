const defaultApiBase = 'http://localhost:3001';

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || defaultApiBase;
  }
  // On the server, fall back to environment or default
  return process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? defaultApiBase;
}
