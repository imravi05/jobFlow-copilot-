import { ApplicationRepository } from '../repositories/ApplicationRepository';
import { ResumeRepository } from '../repositories/ResumeRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';

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
          // Schedule alarm for 6 days
          // In standard development/production, 6 days is 6 * 24 * 60 minutes = 8640 minutes.
          // To make it easy to test, if a developer flag is passed, we can schedule it for a shorter duration,
          // but we follow the exact spec of 6 days (8640 minutes).
          const delayInMinutes = payload.testAlarm ? 0.2 : 6 * 24 * 60; // 12 seconds if test, otherwise 6 days
          
          chrome.alarms.create(`followup_${id}`, {
            delayInMinutes,
          });
        }
        sendResponse({ success: true, id });
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

      // Only send follow-up reminder if the status is still 'Applied'
      if (app.status === 'Applied') {
        const settings = await SettingsRepository.getAllSettings();
        if (!settings.notificationsEnabled) return;

        const notificationId = `notify_${appId}`;
        notificationMap.set(notificationId, app.jobUrl);

        chrome.notifications.create(notificationId, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
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
      // Open job details page
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
