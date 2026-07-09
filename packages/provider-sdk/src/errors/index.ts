export class ProviderError extends Error {
  constructor(public message: string, public code: string) {
    super(message);
    this.name = "ProviderError";
  }
}

export class AuthenticationError extends ProviderError {
  constructor(message: string = "Authentication failed") {
    super(message, "AUTH_ERROR");
  }
}

export class NetworkError extends ProviderError {
  constructor(message: string = "Network error occurred") {
    super(message, "NETWORK_ERROR");
  }
}

export class RateLimitError extends ProviderError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, "RATE_LIMIT_ERROR");
  }
}
