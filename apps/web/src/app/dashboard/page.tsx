"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  Wrench,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  ArrowRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

interface CloudAccount {
  id: string;
  provider: string;
  accountEmail: string;
  status: string;
  lastMaintenanceAt: string | null;
  nextMaintenanceAt: string | null;
}

interface MaintenanceJob {
  id: string;
  status: string;
  startedAt: string;
  totalAccounts: number;
  successfulAccounts: number;
  failedAccounts: number;
  duration: number | null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [recentJobs, setRecentJobs] = useState<MaintenanceJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [accountsRes, jobsRes] = await Promise.allSettled([
          api.get("/accounts"),
          api.get("/jobs?limit=5"),
        ]);

        if (accountsRes.status === "fulfilled") {
          setAccounts(accountsRes.value.data.accounts || []);
        }
        if (jobsRes.status === "fulfilled") {
          setRecentJobs(jobsRes.value.data.jobs || []);
        }
      } catch (err) {
        // Dashboard should still render even if data loading fails
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const activeCount = accounts.filter((a) => a.status === "ACTIVE").length;
  const errorCount = accounts.filter((a) => a.status === "ERROR").length;
  const totalJobs = recentJobs.length;
  const successfulJobs = recentJobs.filter((j) => j.status === "COMPLETED").length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Welcome back, {user?.name?.split(" ")[0] || "User"}
            </p>
          </div>
          <Link href="/accounts">
            <Button className="gap-2">
              <Cloud className="h-4 w-4" /> Add Account
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Accounts
              </CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{accounts.length}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Across all providers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">{activeCount}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {accounts.length > 0
                  ? `${Math.round((activeCount / accounts.length) * 100)}% of total`
                  : "No accounts yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Errors
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{errorCount}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jobs Completed
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{successfulJobs}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {totalJobs > 0
                  ? `${Math.round((successfulJobs / totalJobs) * 100)}% success rate`
                  : "No jobs yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Accounts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Accounts</CardTitle>
              <Link href="/accounts">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Cloud className="h-10 w-10 text-muted-foreground/40" />
                  <div>
                    <p className="font-medium">No accounts yet</p>
                    <p className="text-sm text-muted-foreground">Add your first cloud account to get started</p>
                  </div>
                  <Link href="/accounts">
                    <Button variant="outline" size="sm">
                      Add Account
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.slice(0, 5).map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:border-border"
                    >
                      <div className="flex items-center gap-3">
                        <HardDrive className="h-8 w-8 rounded-lg bg-muted p-1.5" />
                        <div>
                          <p className="text-sm font-medium">{account.provider}</p>
                          <p className="text-xs text-muted-foreground">{account.accountEmail}</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          account.status === "ACTIVE"
                            ? "success"
                            : account.status === "ERROR"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {account.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Jobs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Jobs</CardTitle>
              <Link href="/jobs">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentJobs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Wrench className="h-10 w-10 text-muted-foreground/40" />
                  <div>
                    <p className="font-medium">No jobs yet</p>
                    <p className="text-sm text-muted-foreground">
                      Maintenance jobs will appear here once you add accounts
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:border-border"
                    >
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-8 w-8 rounded-lg bg-muted p-1.5" />
                        <div>
                          <p className="text-sm font-medium">
                            {job.successfulAccounts}/{job.totalAccounts} accounts
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(job.startedAt).toLocaleDateString()}
                            {job.duration ? ` · ${job.duration}s` : ""}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          job.status === "COMPLETED"
                            ? "success"
                            : job.status === "FAILED"
                            ? "destructive"
                            : job.status === "RUNNING"
                            ? "info"
                            : "secondary"
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link href="/accounts">
                <Button variant="outline" className="w-full h-auto flex-col gap-2 py-6">
                  <Cloud className="h-6 w-6" />
                  <div>
                    <p className="font-medium">Add Account</p>
                    <p className="text-xs text-muted-foreground">Connect a new cloud account</p>
                  </div>
                </Button>
              </Link>
              <Link href="/jobs">
                <Button variant="outline" className="w-full h-auto flex-col gap-2 py-6">
                  <Wrench className="h-6 w-6" />
                  <div>
                    <p className="font-medium">Run Maintenance</p>
                    <p className="text-xs text-muted-foreground">Start a maintenance job</p>
                  </div>
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" className="w-full h-auto flex-col gap-2 py-6">
                  <RefreshCw className="h-6 w-6" />
                  <div>
                    <p className="font-medium">Configure Settings</p>
                    <p className="text-xs text-muted-foreground">Update your preferences</p>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}