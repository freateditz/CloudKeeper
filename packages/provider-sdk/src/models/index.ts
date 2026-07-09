import { Provider } from "@cloudkeeper/database";

export interface StorageInfo {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
}

export interface ProviderCapabilities {
  supportsMaintenance: boolean;
  supportsFileUpload: boolean;
}

export interface ProviderMetadata {
  name: string;
  provider: Provider;
}

export enum HealthStatus {
  HEALTHY = "HEALTHY",
  DEGRADED = "DEGRADED",
  DOWN = "DOWN",
}

export interface MaintenanceResult {
  success: boolean;
  message: string;
}
