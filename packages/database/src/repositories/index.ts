import { prisma } from "../client";
import { User, CloudAccount, MaintenanceJob, MaintenanceLog, Settings } from "@prisma/client";

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
}

export class CloudAccountRepository {
  async findByUser(userId: string) {
    return prisma.cloudAccount.findMany({ where: { userId } });
  }

  async create(data: Omit<CloudAccount, "id" | "createdAt" | "updatedAt">) {
    return prisma.cloudAccount.create({ data });
  }
}

export class MaintenanceJobRepository {
  async create(data: Omit<MaintenanceJob, "id" | "startedAt">) {
    return prisma.maintenanceJob.create({ data });
  }
  
  async update(id: string, data: Partial<Omit<MaintenanceJob, "id">>) {
    return prisma.maintenanceJob.update({ where: { id }, data });
  }
}

export class MaintenanceLogRepository {
  async create(data: Omit<MaintenanceLog, "id" | "startedAt">) {
    return prisma.maintenanceLog.create({ data });
  }
}

export class SettingsRepository {
  async findByUserId(userId: string) {
    return prisma.settings.findUnique({ where: { userId } });
  }

  async update(userId: string, data: Partial<Omit<Settings, "id" | "userId" | "createdAt" | "updatedAt">>) {
    return prisma.settings.update({ where: { userId }, data });
  }
}
