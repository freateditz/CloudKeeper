import { describe, it, expect } from "vitest";
import { CredentialVault } from "../CredentialVault";
import { VaultDecryptionError, VaultKeyError } from "../VaultErrors";

const VALID_KEY = "12345678901234567890123456789012"; // 32 bytes

describe("CredentialVault", () => {
  it("should encrypt and decrypt correctly", () => {
    const vault = new CredentialVault(VALID_KEY);
    const password = "my-secret-password";
    const encrypted = vault.encrypt(password);
    const decrypted = vault.decrypt(encrypted);
    expect(decrypted).toBe(password);
  });

  it("should fail decryption with wrong key", () => {
    const vault = new CredentialVault(VALID_KEY);
    const password = "my-secret-password";
    const encrypted = vault.encrypt(password);
    
    const wrongVault = new CredentialVault("wrong-key-that-is-32-chars-long!");
    expect(() => wrongVault.decrypt(encrypted)).toThrow(VaultDecryptionError);
  });

  it("should fail with invalid key length", () => {
    expect(() => new CredentialVault("short-key")).toThrow(VaultKeyError);
  });

  it("should handle unicode passwords", () => {
    const vault = new CredentialVault(VALID_KEY);
    const password = "密码-password-🔥";
    const encrypted = vault.encrypt(password);
    expect(vault.decrypt(encrypted)).toBe(password);
  });

  it("should verify integrity", () => {
    const vault = new CredentialVault(VALID_KEY);
    const encrypted = vault.encrypt("password");
    expect(vault.verifyIntegrity(encrypted)).toBe(true);
    
    const corrupted = { ...encrypted, ciphertext: "corrupted" };
    expect(vault.verifyIntegrity(corrupted)).toBe(false);
  });
});
