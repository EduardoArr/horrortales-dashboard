/** Thrown deliberately with a message that's safe to show to the client.
 *  Server Action errors are NOT redacted by Next.js the way uncaught
 *  render-time errors are — whatever `.message` a thrown Error carries
 *  reaches the client's catch block verbatim. Actions that call external
 *  SDKs (Anthropic, Vercel Blob) or Prisma should catch unexpected errors
 *  and rethrow through runOrGenericError so implementation details never
 *  leak, while intentional validation messages (thrown as UserFacingError)
 *  still reach the UI. */
export class UserFacingError extends Error {}

export async function runOrGenericError<T>(
  fn: () => Promise<T>,
  genericMessage: string
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof UserFacingError) throw err;
    console.error(err);
    throw new UserFacingError(genericMessage);
  }
}
