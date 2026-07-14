export class VaultLogger {
  log(message: string) {
    console.log(`[Vault] ${message}`);
  }

  error(message: string) {
    console.error(`[Vault Error] ${message}`);
  }
}
