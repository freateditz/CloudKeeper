export class BrowserLogger {
  log(message: string, context?: Record<string, any>) {
    console.log(JSON.stringify({ timestamp: new Date(), level: 'INFO', message, ...context }));
  }
  
  error(message: string, error: Error, context?: Record<string, any>) {
    console.error(JSON.stringify({ timestamp: new Date(), level: 'ERROR', message, error: error.message, ...context }));
  }
}
