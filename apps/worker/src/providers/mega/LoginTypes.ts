export enum LoginStatus {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
}

export enum LoginFailureCode {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  MFA_REQUIRED = "MFA_REQUIRED",
  CAPTCHA_DETECTED = "CAPTCHA_DETECTED",
  RATE_LIMITED = "RATE_LIMITED",
  TIMEOUT = "TIMEOUT",
  NETWORK_FAILURE = "NETWORK_FAILURE",
  UNKNOWN = "UNKNOWN",
}

export interface LoginResult {
  status: LoginStatus;
  errorCode?: LoginFailureCode;
  errorMessage?: string;
  durationMs: number;
}
