export class WorkerLogger {
  log(message: string, context?: Record<string, any>) {
    console.log(JSON.stringify({ timestamp: new Date(), message, ...context }));
  }
  
  error(message: string, error: Error, context?: Record<string, any>) {
    console.error(JSON.stringify({ timestamp: new Date(), message, error: error.message, ...context }));
  }
}
