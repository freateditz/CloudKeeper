import crypto from "crypto";
import { EncryptedData } from "./VaultTypes";
import { VaultEncryptionError, VaultDecryptionError } from "./VaultErrors";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export class EncryptionService {
  static encrypt(plainText: string, key: Buffer): EncryptedData {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
      const tag = cipher.getAuthTag();

      return {
        ciphertext: encrypted.toString("base64"),
        iv: iv.toString("base64"),
        tag: tag.toString("base64"),
      };
    } catch (e) {
      throw new VaultEncryptionError();
    }
  }

  static decrypt(encryptedData: EncryptedData, key: Buffer): string {
    try {
      const iv = Buffer.from(encryptedData.iv, "base64");
      const tag = Buffer.from(encryptedData.tag, "base64");
      const ciphertext = Buffer.from(encryptedData.ciphertext, "base64");

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return decrypted.toString("utf8");
    } catch (e) {
      throw new VaultDecryptionError();
    }
  }
}
