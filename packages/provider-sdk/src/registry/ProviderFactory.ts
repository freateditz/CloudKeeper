import { Provider } from "@cloudkeeper/database";
import { BaseProvider } from "../base/BaseProvider";
import { MegaProvider } from "../providers/mega.provider";
import { 
  MediaFireProvider, 
  GoogleDriveProvider, 
  ProtonDriveProvider, 
  PCloudProvider, 
  IcedriveProvider 
} from "../providers";

export class ProviderFactory {
  private static providers = new Map<Provider, () => BaseProvider>([
    [Provider.MEGA, () => new MegaProvider()],
    [Provider.MEDIAFIRE, () => new MediaFireProvider()],
    [Provider.GOOGLE_DRIVE, () => new GoogleDriveProvider()],
    [Provider.PROTON_DRIVE, () => new ProtonDriveProvider()],
    [Provider.PCLOUD, () => new PCloudProvider()],
    [Provider.ICEDRIVE, () => new IcedriveProvider()],
  ]);

  static createProvider(provider: Provider): BaseProvider {
    const providerCreator = this.providers.get(provider);
    if (!providerCreator) {
      throw new Error(`Provider ${provider} not supported`);
    }
    return providerCreator();
  }
}
