import { db } from '../db';
import { AppSettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  dailyGoal: 3,
  notificationsEnabled: true,
  theme: 'light',
};

export class SettingsRepository {
  static async get<T>(key: string, defaultValue: T): Promise<T> {
    const record = await db.settings.get(key);
    return record ? (record.value as T) : defaultValue;
  }

  static async set(key: string, value: any): Promise<void> {
    await db.settings.put({ key, value });
  }

  static async getAllSettings(): Promise<AppSettings> {
    const dailyGoal = await this.get<number>('dailyGoal', DEFAULT_SETTINGS.dailyGoal);
    const notificationsEnabled = await this.get<boolean>(
      'notificationsEnabled',
      DEFAULT_SETTINGS.notificationsEnabled
    );
    const theme = await this.get<'light' | 'dark'>('theme', DEFAULT_SETTINGS.theme);

    return {
      dailyGoal,
      notificationsEnabled,
      theme,
    };
  }

  static async saveAllSettings(settings: AppSettings): Promise<void> {
    await Promise.all([
      this.set('dailyGoal', settings.dailyGoal),
      this.set('notificationsEnabled', settings.notificationsEnabled),
      this.set('theme', settings.theme),
    ]);
  }
}
