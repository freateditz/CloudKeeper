export class CredentialSanitizer {
  static clear(data: { [key: string]: any }): void {
    for (const key in data) {
      if (typeof data[key] === 'string') {
        data[key] = '***';
      }
    }
  }
}
