export enum JobStatus {
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface JobContext {
  jobId: string;
  status: JobStatus;
  startedAt: Date;
  attempt: number;
}
