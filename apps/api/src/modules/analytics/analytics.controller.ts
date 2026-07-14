import { Request, Response } from "express";
import { prisma } from "@cloudkeeper/database";
import { AuthRequest } from "../../middleware/auth.middleware";

export const AnalyticsController = {
  async get(req: Request, res: Response) {
    const authReq = req as AuthRequest;
    const userId = authReq.user.userId;

    const [totalAccounts, activeAccounts, totalJobs, successfulJobs] = await Promise.all([
      prisma.cloudAccount.count({ where: { userId } }),
      prisma.cloudAccount.count({ where: { userId, status: "ACTIVE" } }),
      prisma.maintenanceJob.count(),
      prisma.maintenanceJob.count({ where: { status: "COMPLETED" } }),
    ]);

    res.json({
      accounts: { total: totalAccounts, active: activeAccounts },
      jobs: { total: totalJobs, successful: successfulJobs },
    });
  },
};
