import { CredentialVault } from "@cloudkeeper/security";
import { CloudAccountRepository, AccountStatus, Provider } from "@cloudkeeper/database";

// One shared vault per process — constructed lazily so .env is loaded first.
let _vault: CredentialVault | null = null;
function getVault(): CredentialVault {
  if (_vault) return _vault;
  const key = process.env.MASTER_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "MASTER_ENCRYPTION_KEY is not set. Add it to your .env file (64 hex chars / 32 bytes)."
    );
  }
  _vault = new CredentialVault(key);
  return _vault;
}

const accountRepository = new CloudAccountRepository();

export interface CreateAccountInput {
  provider: Provider;
  accountEmail: string;
  password: string;
  notes?: string;
}

export interface UpdateAccountInput {
  accountEmail?: string;
  password?: string;
  notes?: string;
  status?: AccountStatus;
}

export const AccountsService = {
  async list(userId: string) {
    return accountRepository.findByUser(userId);
  },

  async getById(userId: string, id: string) {
    const account = await accountRepository.findByUserAndId(userId, id);
    if (!account) {
      const err: any = new Error("Account not found");
      err.statusCode = 404;
      throw err;
    }
    return account;
  },

  async create(userId: string, data: CreateAccountInput) {
    const encrypted = getVault().encrypt(data.password);

    return accountRepository.create({
      provider: data.provider,
      accountEmail: data.accountEmail,
      encryptedPassword: encrypted.ciphertext,
      iv: encrypted.iv,
      tag: encrypted.tag,
      userId,
      notes: data.notes ?? null,
      status: AccountStatus.ACTIVE,
    });
  },

  async update(userId: string, id: string, data: UpdateAccountInput) {
    // Make sure the account exists and belongs to this user
    const existing = await accountRepository.findByUserAndId(userId, id);
    if (!existing) {
      const err: any = new Error("Account not found");
      err.statusCode = 404;
      throw err;
    }

    const updateData: Record<string, unknown> = {};
    if (data.accountEmail !== undefined) updateData.accountEmail = data.accountEmail;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.password) {
      const encrypted = getVault().encrypt(data.password);
      updateData.encryptedPassword = encrypted.ciphertext;
      updateData.iv = encrypted.iv;
      updateData.tag = encrypted.tag;
    }

    return accountRepository.update(id, updateData as any);
  },

  async delete(userId: string, id: string) {
    const existing = await accountRepository.findByUserAndId(userId, id);
    if (!existing) {
      const err: any = new Error("Account not found");
      err.statusCode = 404;
      throw err;
    }
    await accountRepository.deleteMany(userId, id);
    return { success: true };
  },

  async revealPassword(userId: string, id: string): Promise<string> {
    const account = await accountRepository.findByUserAndId(userId, id);
    if (!account) {
      const err: any = new Error("Account not found");
      err.statusCode = 404;
      throw err;
    }
    return getVault().decrypt({
      ciphertext: account.encryptedPassword,
      iv: account.iv,
      tag: account.tag,
    });
  },
};
