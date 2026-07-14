export class MegaProviderError extends Error {
  constructor(message: string) {
    super(`[MegaProvider] ${message}`);
    this.name = "MegaProviderError";
  }
}
