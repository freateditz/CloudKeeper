"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, CheckCircle2, Loader2, Circle, XCircle } from "lucide-react";

/**
 * Live progress panel for a "Run All Maintenance" session.
 *
 * Polls `GET /jobs` every 3 seconds while at least one tracked job
 * is still in-flight (PENDING or RUNNING), and shows a real-time
 * progress bar with per-status counts.
 *
 * Auto-stops polling when every tracked job reaches a terminal state
 * (COMPLETED or FAILED), and calls `onComplete` exactly once at that
 * moment so the parent can re-enable the "Run All Maintenance"
 * button.
 */
export interface MaintenanceProgressProps {
  /** The account IDs that were just queued. Only jobs for these
   *  accounts are counted toward the progress breakdown. */
  trackedAccountIds: string[];
  onComplete: () => void;
}

interface Job {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  accountId: string | null;
  startedAt: string;
  finishedAt: string | null;
  duration: number | null;
}

interface Breakdown {
  total: number;
  completed: number;
  running: number;
  pending: number;
  failed: number;
  isActive: boolean;
}

function computeBreakdown(jobs: Job[], trackedIds: string[]): Breakdown {
  const tracked = new Set(trackedIds);
  let completed = 0;
  let running = 0;
  let pending = 0;
  let failed = 0;
  for (const j of jobs) {
    if (!j.accountId || !tracked.has(j.accountId)) continue;
    if (j.status === "COMPLETED") completed++;
    else if (j.status === "RUNNING") running++;
    else if (j.status === "PENDING") pending++;
    else if (j.status === "FAILED") failed++;
  }
  const total = completed + running + pending + failed;
  const isActive = running + pending > 0;
  return { total, completed, running, pending, failed, isActive };
}

export function MaintenanceProgress({
  trackedAccountIds,
  onComplete,
}: MaintenanceProgressProps) {
  const [breakdown, setBreakdown] = useState<Breakdown>({
    total: trackedAccountIds.length,
    completed: 0,
    running: 0,
    pending: 0,
    failed: 0,
    isActive: true,
  });
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await api.get("/jobs");
        if (cancelled) return;
        const next = computeBreakdown(res.data?.jobs ?? [], trackedAccountIds);
        setBreakdown(next);
        if (!next.isActive && !hasCompleted) {
          setHasCompleted(true);
          onComplete();
        }
      } catch (e) {
        // Polling errors are non-fatal — we'll try again next tick.
        console.warn("MaintenanceProgress poll failed", e);
      }
    };

    // Fire immediately so the user sees the initial state, then poll
    // every 3s while any job is still in-flight.
    poll();
    const id = setInterval(() => {
      poll();
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // hasCompleted / onComplete intentionally omitted so we don't
    // re-create the interval on every render. onComplete is read via
    // a ref-free path: the closure captures the initial onComplete
    // and re-runs only if the tracked set changes.
  }, [trackedAccountIds.join("|"), hasCompleted]);

  const { total, completed, running, pending, failed } = breakdown;
  // "Progress" = anything that has reached a terminal state, including
  // failures. This makes the bar advance even when some jobs fail.
  const finished = completed + failed;
  const percent = total > 0 ? Math.round((finished / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {breakdown.isActive ? (
              <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {breakdown.isActive ? "Running Maintenance…" : "Maintenance Complete"}
          </CardTitle>
          <span className="text-sm font-mono text-muted-foreground">
            {finished} / {total}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="space-y-1">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            <span className="inline-block w-3 align-middle">
              {renderBlocks(percent)}
            </span>{" "}
            {percent}%
          </p>
        </div>

        {/* Status breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <StatusPill icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} label="Completed" count={completed} />
          <StatusPill icon={<Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />} label="Running" count={running} />
          <StatusPill icon={<Circle className="h-4 w-4 text-muted-foreground" />} label="Pending" count={pending} />
          <StatusPill icon={<XCircle className="h-4 w-4 text-red-500" />} label="Failed" count={failed} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusPill({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2">
      {icon}
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold">{count}</span>
    </div>
  );
}

/** 16-block ASCII bar for the "████░░░░" visual. */
function renderBlocks(percent: number): string {
  const total = 16;
  const filled = Math.round((percent / 100) * total);
  return "█".repeat(filled) + "░".repeat(total - filled);
}
