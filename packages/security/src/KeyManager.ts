import { VaultKeyError } from "./VaultErrors";

export class KeyManager {
  private key: Buffer;

  constructor(key: string) {
    if (!key) {
      throw new VaultKeyError("Master key is required.");
    }

    if (!/^[a-fA-F0-9]{64}$/.test(key)) {
      throw new VaultKeyError(
        "Master key must be a 64-character hexadecimal string (32 bytes)."
      );
    }

    this.key = Buffer.from(key, "hex");

    if (this.key.length !== 32) {
      throw new VaultKeyError(
        "Master key must decode to exactly 32 bytes."
      );
    }
  }

  getKey(): Buffer {
    return this.key;
  }
}