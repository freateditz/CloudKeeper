"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Wrench, RefreshCw, Clock, HardDrive } from "lucide-react";
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
  accountId: string | null;
  provider: string | null;
}

interface CloudAccount {
  id: string;
  provider: string;
  accountEmail: string;
  status: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsRes, accountsRes] = await Promise.all([
        api.get("/jobs"),
        api.get("/accounts"),
      ]);
      setJobs(jobsRes.data.jobs || []);
      setAccounts(accountsRes.data.accounts || []);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const runMaintenance = async (accountId: string, provider: string) => {
    setRunning(accountId);
    try {
      await api.post("/jobs", { accountId, provider });
      toast({ title: "Maintenance job started" });
      loadData();
    } catch (error) {
      toast({ title: "Failed to start maintenance job", variant: "destructive" });
    } finally {
      setRunning(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
        
        <div className="grid gap-6 lg:grid-cols-2">
            <div>
                <h2 className="text-xl font-semibold mb-4">Cloud Accounts</h2>
                <div className="space-y-4">
                    {accounts.map(account => (
                        <Card key={account.id}>
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <HardDrive className="h-8 w-8 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">{account.provider}</p>
                                        <p className="text-sm text-muted-foreground">{account.accountEmail}</p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => runMaintenance(account.id, account.provider)} 
                                    loading={running === account.id}
                                    variant="outline"
                                >
                                    <Wrench className="h-4 w-4 mr-2" /> Run Maintenance
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Recent Jobs</h2>
                {loading ? (
                  <p>Loading jobs...</p>
                ) : (
                  <div className="grid gap-4">
                    {jobs.length === 0 ? (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                          <Clock className="h-12 w-12 text-muted-foreground/40 mb-4" />
                          <h3 className="text-lg font-semibold">No jobs yet</h3>
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
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <p>{new Date(job.startedAt).toLocaleString()}</p>
                                <p>{job.provider}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
