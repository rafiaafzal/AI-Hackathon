export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('overloaded')
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delays = [2000, 4000, 8000]
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: unknown) {
      attempt++;
      if (attempt > maxRetries || !isRetryableError(err)) {
        throw err;
      }
      const delay = delays[attempt - 1] ?? delays[delays.length - 1] * 2;
      console.warn(
        `[withRetry] Attempt ${attempt} encountered retryable error. Waiting ${delay}ms before retrying...`
      );
      await sleep(delay);
    }
  }
}
