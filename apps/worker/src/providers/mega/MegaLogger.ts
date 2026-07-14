export class MegaLogger {
  log(message: string, context?: Record<string, any>) {
    console.log(JSON.stringify({ timestamp: new Date(), level: 'INFO', provider: 'MEGA', message, ...context }));
  }
  
  error(message: string, error: Error, context?: Record<string, any>) {
    console.error(JSON.stringify({ timestamp: new Date(), level: 'ERROR', provider: 'MEGA', message, error: error.message, ...context }));
  }
}
