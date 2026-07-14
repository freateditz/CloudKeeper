export class VaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VaultError";
  }
}

export class VaultEncryptionError extends VaultError {
  constructor(message: string = "Encryption failed") {
    super(message);
  }
}

export class VaultDecryptionError extends VaultError {
  constructor(message: string = "Decryption failed") {
    super(message);
  }
}

export class VaultKeyError extends VaultError {
  constructor(message: string = "Invalid master key") {
    super(message);
  }
}
