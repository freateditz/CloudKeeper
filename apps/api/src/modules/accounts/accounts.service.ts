import { prisma } from "@cloudkeeper/database";

// In production, use a secure key management system (KMS)
const encrypt = (password: string) => Buffer.from(password).toString("base64");
const decrypt = (encrypted: string) => Buffer.from(encrypted, "base64").toString("utf-8");

export const AccountsService = {
  async list(userId: string) {
    return prisma.cloudAccount.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  },

  async create(userId: string, data: { provider: any; accountEmail: string; password: string; notes?: string }) {
    return prisma.cloudAccount.create({
      data: {
        ...data,
        encryptedPassword: encrypt(data.password),
        userId,
      },
    });
  },

  async getById(id: string, userId: string) {
    return prisma.cloudAccount.findFirst({ where: { id, userId } });
  },

  async delete(id: string, userId: string) {
    return prisma.cloudAccount.deleteMany({ where: { id, userId } });
  }
};
