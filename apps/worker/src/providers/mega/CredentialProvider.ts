export interface Credentials {
  email: string;
  password: string;
}

export interface CredentialProvider {
  getCredentials(accountId: string): Promise<Credentials>;
}
