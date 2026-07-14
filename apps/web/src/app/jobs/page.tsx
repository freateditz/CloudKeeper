"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Wrench, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface Job {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  duration: number | null;
  totalAccounts: number;
  successfulAccounts: number;
  failedAccounts: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/jobs");
      setJobs(res.data.jobs || []);
    } catch (error) {
      console.error("Failed to load jobs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const runMaintenance = async () => {
    setRunning(true);
    try {
      await api.post("/jobs");
      toast({ title: "Maintenance job started" });
      loadJobs();
    } catch (error) {
      toast({ title: "Failed to start maintenance job", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Jobs</h1>
          <Button className="gap-2" onClick={runMaintenance} loading={running}>
            <Wrench className="h-4 w-4" /> Run Maintenance
          </Button>
        </div>

        {loading ? (
          <p>Loading jobs...</p>
        ) : (
          <div className="grid gap-4">
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold">No jobs yet</h3>
                  <p className="text-muted-foreground mt-1">Run a maintenance job to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-medium">Job {job.id.slice(0, 8)}</CardTitle>
                            <Badge variant={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'destructive' : 'secondary'}>
                                {job.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm">
                        <p className="text-muted-foreground">Started: {new Date(job.startedAt).toLocaleString()}</p>
                        <p>{job.successfulAccounts} / {job.totalAccounts} successful</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
