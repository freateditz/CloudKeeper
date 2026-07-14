import { CredentialProvider, Credentials } from "./CredentialProvider";
import { CloudAccountRepository } from "@cloudkeeper/database";
import { CredentialVault } from "@cloudkeeper/security";

export class CredentialResolver implements CredentialProvider {
  private vault: CredentialVault;
  private accountRepository = new CloudAccountRepository();

  constructor(masterKey: string) {
    this.vault = new CredentialVault(masterKey);
  }

  async getCredentials(accountId: string): Promise<Credentials> {
    const account = await this.accountRepository.findById(accountId); 
    if (!account) throw new Error("Account not found");

    const password = this.vault.decrypt({
      ciphertext: account.encryptedPassword,
      iv: account.iv, 
      tag: account.tag 
    });

    return {
      email: account.accountEmail,
      password
    };
  }
}
