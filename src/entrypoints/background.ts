import { defineBackground } from 'wxt/sandbox';
import { ApplicationRepository } from '@/repositories/ApplicationRepository';
import { ResumeRepository } from '@/repositories/ResumeRepository';
import { SettingsRepository } from '@/repositories/SettingsRepository';

export default defineBackground(() => {
  // Map of notification IDs to Job URLs
  const notificationMap = new Map<string, string>();

  // Listen for messages from Content Scripts or the React UI
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { action, payload } = message;

    if (action === 'CHECK_DUPLICATE') {
      ApplicationRepository.getByUrl(payload.url)
        .then((app) => {
          sendResponse({ exists: !!app, app });
        })
        .catch((err) => {
          sendResponse({ error: err.message });
        });
      return true; // Keep message channel open for async response
    }

    if (action === 'GET_RESUMES') {
      ResumeRepository.getAll()
        .then((resumes) => {
          sendResponse({ resumes });
        })
        .catch((err) => {
          sendResponse({ error: err.message });
        });
      return true;
    }

    if (action === 'SAVE_APPLICATION') {
      ApplicationRepository.add(payload.application)
        .then(async (id) => {
          const settings = await SettingsRepository.getAllSettings();
          if (settings.notificationsEnabled) {
            const delayInMinutes = payload.testAlarm ? 0.2 : 6 * 24 * 60; // 12 seconds if test, otherwise 6 days
            
            chrome.alarms.create(`followup_${id}`, {
              delayInMinutes,
            });
          }
          sendResponse({ success: true, id });

          // Broadcast message to refresh UI counts
          chrome.runtime.sendMessage({ action: 'REFRESH_DATA' }, () => {
            // Ignore error if no listener is active (e.g. popup is closed)
            const err = chrome.runtime.lastError;
          });
        })
        .catch((err) => {
          sendResponse({ error: err.message });
        });
      return true;
    }

    if (action === 'GET_SETTINGS') {
      SettingsRepository.getAllSettings()
        .then((settings) => {
          sendResponse({ settings });
        })
        .catch((err) => {
          sendResponse({ error: err.message });
        });
      return true;
    }
  });

  // Listen for Chrome alarms
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name.startsWith('followup_')) {
      const appId = parseInt(alarm.name.split('_')[1], 10);
      if (isNaN(appId)) return;

      try {
        const app = await ApplicationRepository.getById(appId);
        if (!app || app.reminderSent) return;

        if (app.status === 'Applied') {
          const settings = await SettingsRepository.getAllSettings();
          if (!settings.notificationsEnabled) return;

          const notificationId = `notify_${appId}`;
          notificationMap.set(notificationId, app.jobUrl);

          chrome.notifications.create(notificationId, {
            type: 'basic',
            iconUrl: '/icons/icon128.png', // WXT loads assets from the public dir
            title: 'JobFlow Application Follow-up',
            message: `It has been 6 days since you applied to ${app.title} at ${app.company}. Would you like to follow up?`,
            buttons: [
              { title: 'Open Job Details' },
              { title: 'Dismiss' }
            ],
            priority: 2,
            requireInteraction: true
          });

          // Mark reminder as sent
          await ApplicationRepository.update(appId, { reminderSent: true });
        }
      } catch (error) {
        console.error('Error handling follow-up alarm:', error);
      }
    }
  });

  // Listen for notification button clicks
  chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (notificationId.startsWith('notify_')) {
      const jobUrl = notificationMap.get(notificationId);
      
      if (buttonIndex === 0 && jobUrl) {
        chrome.tabs.create({ url: jobUrl });
      }
      
      chrome.notifications.clear(notificationId);
      notificationMap.delete(notificationId);
    }
  });

  // Clear notification map on click of the body of the notification
  chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId.startsWith('notify_')) {
      const jobUrl = notificationMap.get(notificationId);
      if (jobUrl) {
        chrome.tabs.create({ url: jobUrl });
      }
      chrome.notifications.clear(notificationId);
      notificationMap.delete(notificationId);
    }
  });
});
