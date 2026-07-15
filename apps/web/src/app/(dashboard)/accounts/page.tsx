"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Cloud, Search, Filter, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { DeleteAccountDialog } from "@/components/accounts/delete-account-dialog";
import { MaintenanceProgress } from "@/components/accounts/maintenance-progress";

interface CloudAccount {
  id: string;
  provider: string;
  accountEmail: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'MAINTENANCE';
}

/** Shape of a job as returned by GET /jobs — only the fields we use. */
interface Job {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  accountId: string | null;
  startedAt: string;
  finishedAt: string | null;
  duration: number | null;
}

type AccountMaintStatus = "COMPLETED" | "RUNNING" | "PENDING" | "FAILED" | "IDLE";

/** Per-account emoji + label for the maintenance status. */
function statusBadge(status: AccountMaintStatus): { emoji: string; label: string; className: string } {
  switch (status) {
    case "COMPLETED":
      return { emoji: "🟢", label: "Completed", className: "text-green-600" };
    case "RUNNING":
      return { emoji: "🟡", label: "Running", className: "text-yellow-600" };
    case "PENDING":
      return { emoji: "⚪", label: "Pending", className: "text-muted-foreground" };
    case "FAILED":
      return { emoji: "🔴", label: "Failed", className: "text-red-600" };
    default:
      return { emoji: "⚪", label: "Idle", className: "text-muted-foreground" };
  }
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  // `runningAll` doubles as the "is a session in progress" flag — it
  // gates the button and drives the "Running…" label. It is released
  // only when MaintenanceProgress reports that all tracked jobs are
  // terminal.
  const [runningAll, setRunningAll] = useState(false);
  // Account IDs of the jobs queued by the most recent "Run All" call.
  // Drives the live progress panel and the per-account status polling.
  const [sessionAccountIds, setSessionAccountIds] = useState<string[] | null>(null);
  // Latest known maintenance job per account (keyed by accountId). Used
  // to render per-account status badges that auto-update while a
  // session is running. Stays empty when no session is active.
  const [latestJobByAccount, setLatestJobByAccount] = useState<Record<string, Job>>({});
  const { toast } = useToast();

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/accounts");
      setAccounts(res.data.accounts || []);
    } catch (error) {
      console.error("Failed to load accounts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // While a Run All session is in progress, poll /jobs every 3s so the
  // per-account status badges track each job's lifecycle. Stops as soon
  // as the session ends (sessionAccountIds is cleared on onComplete).
  useEffect(() => {
    if (!sessionAccountIds) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.get("/jobs");
        if (cancelled) return;
        const jobs: Job[] = res.data?.jobs ?? [];
        const tracked = new Set(sessionAccountIds);
        const next: Record<string, Job> = {};
        // For each tracked account, find the most recent job. /jobs
        // returns jobs in arbitrary order, so we compare startedAt.
        for (const j of jobs) {
          if (!j.accountId || !tracked.has(j.accountId)) continue;
          const existing = next[j.accountId];
          if (!existing || new Date(j.startedAt) > new Date(existing.startedAt)) {
            next[j.accountId] = j;
          }
        }
        setLatestJobByAccount(next);
      } catch (e) {
        console.warn("AccountsPage job poll failed", e);
      }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [sessionAccountIds]);

  // Stable callback so the MaintenanceProgress interval doesn't restart
  // on every render of this page.
  const onSessionComplete = useCallback(() => {
    setSessionAccountIds(null);
    setRunningAll(false);
  }, []);

  const megaAccountCount = accounts.filter((a) => a.provider === "MEGA").length;

  const runAllMaintenance = async () => {
    setRunningAll(true);
    try {
      const res = await api.post("/jobs/run-all");
      const queued: number = res.data?.queued ?? 0;
      const skipped: number = res.data?.skipped ?? 0;
      const jobs: Array<{ accountId: string | null }> = res.data?.jobs ?? [];
      const queuedAccountIds = jobs
        .map((j) => j.accountId)
        .filter((id): id is string => typeof id === "string");

      const parts: string[] = [];
      parts.push(
        `Queued maintenance for ${queued} account${queued === 1 ? "" : "s"}.`
      );
      if (skipped > 0) {
        parts.push(`${skipped} skipped (already in progress).`);
      }
      toast({ title: parts.join(" ") });

      // Seed the live progress session with the account IDs that were
      // actually queued. The server's `skipped` accounts are excluded
      // — we never want to wait on jobs we didn't create.
      if (queuedAccountIds.length > 0) {
        setSessionAccountIds(queuedAccountIds);
      } else {
        // Nothing was queued (everything was skipped) — release the
        // button immediately so the user can retry.
        setRunningAll(false);
      }

      loadAccounts();
    } catch (error) {
      console.error("Failed to run all maintenance", error);
      toast({
        title: "Failed to queue maintenance",
        variant: "destructive",
      });
      setRunningAll(false);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.accountEmail.toLowerCase().includes(search.toLowerCase()) ||
                          account.provider.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || account.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Cloud Accounts</h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={runAllMaintenance}
              // Disable while a session is in flight OR while the
              // initial POST is in flight, to prevent duplicate clicks.
              disabled={runningAll || megaAccountCount === 0}
              variant="outline"
            >
              <Wrench className="h-4 w-4 mr-2" />
              {runningAll ? "Running…" : "Run All Maintenance"}
            </Button>
            <AddAccountDialog onSuccess={loadAccounts} />
          </div>
        </div>

        {/* Live progress panel — only rendered while a session is
            active. Owns its own polling and reports completion via
            onSessionComplete, which clears sessionAccountIds and
            releases runningAll. */}
        {sessionAccountIds && sessionAccountIds.length > 0 && (
          <MaintenanceProgress
            trackedAccountIds={sessionAccountIds}
            onComplete={onSessionComplete}
          />
        )}

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ERROR">Error</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>

            {loading ? (
              <p>Loading accounts...</p>
        ) : (
          <div className="grid gap-4">
            {filteredAccounts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Cloud className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold">No accounts found</h3>
                  <p className="text-muted-foreground mt-1">Try adjusting your search or filters.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAccounts.map((account) => {
                  // Per-account maintenance status: prefer the polled
                  // job data when we have it (active session),
                  // otherwise fall back to IDLE.
                  const job = latestJobByAccount[account.id];
                  const badge = statusBadge(job?.status ?? "IDLE");
                  return (
                    <Card key={account.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-medium">{account.provider}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={account.status === 'ACTIVE' ? 'success' : 'secondary'}>
                              {account.status}
                            </Badge>
                            <DeleteAccountDialog accountId={account.id} onSuccess={loadAccounts} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{account.accountEmail}</p>
                        {/* Maintenance status — emoji + label, kept in
                            sync by the polling effect above. Hidden
                            when no session has ever touched this
                            account, to avoid spurious "Idle" badges
                            on accounts that have never been checked. */}
                        {job && (
                          <p
                            className={`mt-2 text-xs flex items-center gap-1 ${badge.className}`}
                            data-testid={`maint-status-${account.id}`}
                          >
                            <span aria-hidden>{badge.emoji}</span>
                            <span>Maintenance: {badge.label}</span>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
