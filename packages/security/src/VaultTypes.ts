export interface EncryptedData {
  ciphertext: string; // base64
  iv: string;         // base64
  tag: string;        // base64
}

export interface VaultConfig {
  masterKey: string;
}
