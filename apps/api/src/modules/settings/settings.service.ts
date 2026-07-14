import { SettingsRepository } from "@cloudkeeper/database";

const settingsRepository = new SettingsRepository();

export const SettingsService = {
  async get(userId: string) {
    const settings = await settingsRepository.findByUserId(userId);
    if (!settings) {
      // Return default settings if none exist
      return {
        telegramWebhook: null,
        discordWebhook: null,
        emailNotification: true,
        timezone: "UTC",
      };
    }
    return settings;
  },

  async update(userId: string, data: any) {
    return settingsRepository.upsert(userId, data);
  },
};
