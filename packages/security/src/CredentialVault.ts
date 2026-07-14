import { KeyManager } from "./KeyManager";
import { EncryptionService } from "./EncryptionService";
import { VaultLogger } from "./VaultLogger";
import { EncryptedData } from "./VaultTypes";

export class CredentialVault {
  private keyManager: KeyManager;
  private logger = new VaultLogger();

  constructor(masterKey: string) {
    this.keyManager = new KeyManager(masterKey);
  }

  encrypt(plainText: string): EncryptedData {
    this.logger.log("Encrypting data");
    return EncryptionService.encrypt(plainText, this.keyManager.getKey());
  }

  decrypt(encryptedData: EncryptedData): string {
    this.logger.log("Decrypting data");
    return EncryptionService.decrypt(encryptedData, this.keyManager.getKey());
  }

  rotateKey(encryptedData: EncryptedData, newMasterKey: string): EncryptedData {
    const plainText = this.decrypt(encryptedData);
    const newVault = new CredentialVault(newMasterKey);
    return newVault.encrypt(plainText);
  }

  validateKey(key: string): boolean {
    try {
      new KeyManager(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  verifyIntegrity(encryptedData: EncryptedData): boolean {
    try {
      this.decrypt(encryptedData);
      return true;
    } catch (e) {
      return false;
    }
  }
}
