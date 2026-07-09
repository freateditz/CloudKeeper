export class RetryManager {
  static shouldRetry(attempt: number, maxAttempts: number): boolean {
    return attempt < maxAttempts;
  }
}
