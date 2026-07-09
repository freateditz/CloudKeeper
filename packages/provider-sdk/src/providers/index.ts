import { BaseProvider } from "../base/BaseProvider";
import { StorageInfo, ProviderMetadata, ProviderCapabilities, HealthStatus, MaintenanceResult } from "../models";
import { Provider } from "@cloudkeeper/database";

export class MediaFireProvider extends BaseProvider {
  validateCredentials(credentials: any): Promise<boolean> { return Promise.resolve(true); }
  connect(): Promise<void> { return Promise.resolve(); }
  disconnect(): Promise<void> { return Promise.resolve(); }
  checkHealth(): Promise<HealthStatus> { return Promise.resolve(HealthStatus.HEALTHY); }
  getStorageInfo(): Promise<StorageInfo> { return Promise.resolve({ totalBytes: 0, usedBytes: 0, freeBytes: 0 }); }
  getProviderMetadata(): ProviderMetadata { return { name: "MediaFire", provider: Provider.MEDIAFIRE }; }
  supportsFeature(feature: keyof ProviderCapabilities): boolean { return true; }
  maintenanceCheck(): Promise<MaintenanceResult> { return Promise.resolve({ success: true, message: "OK" }); }
}

export class GoogleDriveProvider extends BaseProvider {
  validateCredentials(credentials: any): Promise<boolean> { return Promise.resolve(true); }
  connect(): Promise<void> { return Promise.resolve(); }
  disconnect(): Promise<void> { return Promise.resolve(); }
  checkHealth(): Promise<HealthStatus> { return Promise.resolve(HealthStatus.HEALTHY); }
  getStorageInfo(): Promise<StorageInfo> { return Promise.resolve({ totalBytes: 0, usedBytes: 0, freeBytes: 0 }); }
  getProviderMetadata(): ProviderMetadata { return { name: "Google Drive", provider: Provider.GOOGLE_DRIVE }; }
  supportsFeature(feature: keyof ProviderCapabilities): boolean { return true; }
  maintenanceCheck(): Promise<MaintenanceResult> { return Promise.resolve({ success: true, message: "OK" }); }
}

export class ProtonDriveProvider extends BaseProvider {
  validateCredentials(credentials: any): Promise<boolean> { return Promise.resolve(true); }
  connect(): Promise<void> { return Promise.resolve(); }
  disconnect(): Promise<void> { return Promise.resolve(); }
  checkHealth(): Promise<HealthStatus> { return Promise.resolve(HealthStatus.HEALTHY); }
  getStorageInfo(): Promise<StorageInfo> { return Promise.resolve({ totalBytes: 0, usedBytes: 0, freeBytes: 0 }); }
  getProviderMetadata(): ProviderMetadata { return { name: "Proton Drive", provider: Provider.PROTON_DRIVE }; }
  supportsFeature(feature: keyof ProviderCapabilities): boolean { return true; }
  maintenanceCheck(): Promise<MaintenanceResult> { return Promise.resolve({ success: true, message: "OK" }); }
}

export class PCloudProvider extends BaseProvider {
  validateCredentials(credentials: any): Promise<boolean> { return Promise.resolve(true); }
  connect(): Promise<void> { return Promise.resolve(); }
  disconnect(): Promise<void> { return Promise.resolve(); }
  checkHealth(): Promise<HealthStatus> { return Promise.resolve(HealthStatus.HEALTHY); }
  getStorageInfo(): Promise<StorageInfo> { return Promise.resolve({ totalBytes: 0, usedBytes: 0, freeBytes: 0 }); }
  getProviderMetadata(): ProviderMetadata { return { name: "pCloud", provider: Provider.PCLOUD }; }
  supportsFeature(feature: keyof ProviderCapabilities): boolean { return true; }
  maintenanceCheck(): Promise<MaintenanceResult> { return Promise.resolve({ success: true, message: "OK" }); }
}

export class IcedriveProvider extends BaseProvider {
  validateCredentials(credentials: any): Promise<boolean> { return Promise.resolve(true); }
  connect(): Promise<void> { return Promise.resolve(); }
  disconnect(): Promise<void> { return Promise.resolve(); }
  checkHealth(): Promise<HealthStatus> { return Promise.resolve(HealthStatus.HEALTHY); }
  getStorageInfo(): Promise<StorageInfo> { return Promise.resolve({ totalBytes: 0, usedBytes: 0, freeBytes: 0 }); }
  getProviderMetadata(): ProviderMetadata { return { name: "Icedrive", provider: Provider.ICEDRIVE }; }
  supportsFeature(feature: keyof ProviderCapabilities): boolean { return true; }
  maintenanceCheck(): Promise<MaintenanceResult> { return Promise.resolve({ success: true, message: "OK" }); }
}
