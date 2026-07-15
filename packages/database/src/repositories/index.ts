import { prisma } from "../client";
import {
  User,
  CloudAccount,
  MaintenanceJob,
  MaintenanceLog,
  Settings,
  PasswordResetToken,
  Provider,
  AccountStatus,
  JobStatus,
} from "@prisma/client";

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: Omit<User, "id" | "createdAt" | "updatedAt">) {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>) {
    return prisma.user.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}

export class CloudAccountRepository {
  async findById(id: string) {
    return prisma.cloudAccount.findUnique({ where: { id } });
  }

  async findByUser(userId: string) {
    return prisma.cloudAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByUserAndId(userId: string, id: string) {
    return prisma.cloudAccount.findFirst({ where: { id, userId } });
  }

  async create(data: Omit<CloudAccount, "id" | "createdAt" | "updatedAt" | "lastMaintenanceAt" | "nextMaintenanceAt">) {
    return prisma.cloudAccount.create({
      data: {
        ...data,
        lastMaintenanceAt: null,
        nextMaintenanceAt: null,
      },
    });
  }

  async update(id: string, data: Partial<Omit<CloudAccount, "id" | "createdAt" | "updatedAt">>) {
    return prisma.cloudAccount.update({ where: { id }, data });
  }

  async deleteMany(userId: string, id: string) {
    return prisma.cloudAccount.deleteMany({ where: { id, userId } });
  }
}

export class MaintenanceJobRepository {
  async findPending() {
    return prisma.maintenanceJob.findMany({
      where: { status: JobStatus.PENDING },
      orderBy: { startedAt: "asc" },
    });
  }

  async create(data: Omit<MaintenanceJob, "id" | "startedAt" | "finishedAt">) {
    return prisma.maintenanceJob.create({ data });
  }

  async findById(id: string) {
    return prisma.maintenanceJob.findUnique({ where: { id } });
  }

  async findAll(limit = 50) {
    return prisma.maintenanceJob.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
      include: { maintenanceLogs: true },
    });
  }

  async findInFlightForAccounts(accountIds: string[]) {
    if (accountIds.length === 0) return [];
    return prisma.maintenanceJob.findMany({
      where: {
        accountId: { in: accountIds },
        status: { in: [JobStatus.PENDING, JobStatus.RUNNING] },
      },
      select: { id: true, accountId: true, status: true },
    });
  }

  async update(id: string, data: Partial<Omit<MaintenanceJob, "id">>) {
    return prisma.maintenanceJob.update({ where: { id }, data });
  }
}

export class MaintenanceLogRepository {
  async create(data: Omit<MaintenanceLog, "id" | "startedAt">) {
    return prisma.maintenanceLog.create({ data });
  }

  async findByJob(jobId: string) {
    return prisma.maintenanceLog.findMany({
      where: { maintenanceJobId: jobId },
      orderBy: { startedAt: "desc" },
    });
  }

  async findByAccount(accountId: string, limit = 50) {
    return prisma.maintenanceLog.findMany({
      where: { cloudAccountId: accountId },
      orderBy: { startedAt: "desc" },
      take: limit,
    });
  }
}

export class SettingsRepository {
  async findByUserId(userId: string) {
    return prisma.settings.findUnique({ where: { userId } });
  }

  async upsert(userId: string, data: Partial<Omit<Settings, "id" | "userId" | "createdAt" | "updatedAt">>) {
    return prisma.settings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async update(userId: string, data: Partial<Omit<Settings, "id" | "userId" | "createdAt" | "updatedAt">>) {
    return prisma.settings.update({ where: { userId }, data });
  }
}

export class PasswordResetTokenRepository {
  async create(data: Omit<PasswordResetToken, "createdAt">) {
    return prisma.passwordResetToken.create({ data });
  }

  async findByToken(token: string) {
    return prisma.passwordResetToken.findUnique({ where: { token } });
  }

  async delete(token: string) {
    return prisma.passwordResetToken.delete({ where: { token } });
  }
}

// Re-export enums for downstream consumers (e.g. validators)
export { Provider, AccountStatus, JobStatus };
