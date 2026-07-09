import { StorageInfo, ProviderMetadata, ProviderCapabilities, HealthStatus, MaintenanceResult } from "../models";

export abstract class BaseProvider {
  abstract validateCredentials(credentials: any): Promise<boolean>;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract checkHealth(): Promise<HealthStatus>;
  abstract getStorageInfo(): Promise<StorageInfo>;
  abstract getProviderMetadata(): ProviderMetadata;
  abstract supportsFeature(feature: keyof ProviderCapabilities): boolean;
  abstract maintenanceCheck(): Promise<MaintenanceResult>;
}
