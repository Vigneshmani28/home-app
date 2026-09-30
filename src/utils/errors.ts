/**
 * Best-effort readable message from anything that was thrown.
 *
 * Supabase (PostgREST) errors are plain objects with a `message`, NOT `Error` instances, so
 * `error instanceof Error` is false for them and the real reason (a missing column, an RLS
 * denial, a constraint violation...) was being swallowed behind a generic fallback.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  if (typeof error === 'string' && error) return error;
  return fallback;
}
