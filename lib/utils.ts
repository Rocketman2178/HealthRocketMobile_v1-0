interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  shouldRetry: (error: any) => boolean;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let retries = 0;
  let delay = options.initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      
      if (retries > options.maxRetries || !options.shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      delay = Math.min(
        delay * (1.5 + Math.random() * 0.5),
        options.maxDelay
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}