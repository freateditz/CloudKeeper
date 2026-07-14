export interface Job {
  id: string;
  payload: any;
  priority: number;
}

export interface Queue {
  enqueue(job: Job): void;
  dequeue(): Job | undefined;
  cancel(jobId: string): void;
  size(): number;
}

export class InMemoryQueue implements Queue {
  private jobs: Job[] = [];

  enqueue(job: Job) {
    this.jobs.push(job);
    this.jobs.sort((a, b) => b.priority - a.priority);
  }

  dequeue(): Job | undefined {
    return this.jobs.shift();
  }

  cancel(jobId: string) {
    this.jobs = this.jobs.filter((j) => j.id !== jobId);
  }

  size(): number {
    return this.jobs.length;
  }
}
