import { BaseProvider } from "../base/BaseProvider";
import { StorageInfo, ProviderMetadata, ProviderCapabilities, HealthStatus, MaintenanceResult } from "../models";
import { Provider } from "@cloudkeeper/database";

export class MegaProvider extends BaseProvider {
  validateCredentials(credentials: any): Promise<boolean> { return Promise.resolve(true); }
  connect(): Promise<void> { return Promise.resolve(); }
  disconnect(): Promise<void> { return Promise.resolve(); }
  checkHealth(): Promise<HealthStatus> { return Promise.resolve(HealthStatus.HEALTHY); }
  getStorageInfo(): Promise<StorageInfo> { return Promise.resolve({ totalBytes: 0, usedBytes: 0, freeBytes: 0 }); }
  getProviderMetadata(): ProviderMetadata { return { name: "MEGA", provider: Provider.MEGA }; }
  supportsFeature(feature: keyof ProviderCapabilities): boolean { return true; }
  maintenanceCheck(): Promise<MaintenanceResult> { return Promise.resolve({ success: true, message: "OK" }); }
}
