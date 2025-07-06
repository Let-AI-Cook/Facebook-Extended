import { defaultSelectors } from './selectors.js';
import { defaultPhrases } from './phrases.js';

let badgeCount = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateBadgeCount') {
    badgeCount = typeof request.count === 'number' || typeof request.count === 'string' ? request.count : 0;
    updateBadgeText();
    return true; 
  }
  return true;
});

const updateBadgeText = () => {
  const countValue = badgeCount || 0;
  const text = countValue ? String(countValue) : "";
  
  if (chrome.action && chrome.action.setBadgeText) {
    chrome.action.setBadgeText({ text: text.toString() }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error setting badge text:', chrome.runtime.lastError);
      }
    });
    if (text && chrome.action.setBadgeBackgroundColor && chrome.action.setBadgeTextColor) {
      try {
        chrome.action.setBadgeTextColor({ color: 'white' });
        chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
      } catch (e) {
        console.error('Error setting badge color:', e);
      }
    }
  }
};


chrome.runtime.onStartup.addListener(() => {
  badgeCount = 0;
  updateBadgeText();
});


chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install" || details.reason === "update") {
    badgeCount = 0;
    updateBadgeText();

    chrome.storage.sync.get(null, (items) => {
      const defaults = {
        adBlockEnabled: true,
        adAction: 'remove', // 'remove' or 'hide'
        reelsEnabled: false,
        suggestEnabled: false,
        compactUIValue: '0',
        storyEnabled: false,
        newFeedsEnabled: false,
        commentFilterEnabled: false,
        commentFilters: 'vay, 88uytin,vb88,789uytin, l.php?u=',
        selectors: defaultSelectors,
        phrases: defaultPhrases
      };
      
      let settingsToSet = {};
      let changed = false;
      for (const key in defaults) {
        if (!(key in items)) {
          settingsToSet[key] = defaults[key];
          changed = true;
        }
      }

      // Special check for selectors and phrases to allow for updates
      if (!items.selectors || details.reason === "update") {
          settingsToSet.selectors = defaultSelectors;
          changed = true;
      }
      if (!items.phrases || details.reason === "update") {
          settingsToSet.phrases = defaultPhrases;
          changed = true;
      }

      if (changed) {
        chrome.storage.sync.set(settingsToSet, () => {
          if (chrome.runtime.lastError) {
            console.error('Error setting default values:', chrome.runtime.lastError);
          } else {
            console.log('Default settings and selectors have been initialized/updated.');
          }
        });
      }
    });
  }
});

function checkForUpdates() {
  const manifest = chrome.runtime.getManifest();
  const currentVersion = manifest.version;
  const updateUrl = 'https://raw.githubusercontent.com/Let-AI-Cook/Facebook-Extended/refs/heads/main/version.txt';

  fetch(updateUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(latestVersionText => {
      const latestVersion = latestVersionText.trim();
      if (currentVersion !== latestVersion) {
        chrome.notifications.create('update-notification', {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Cập nhật mới có sẵn!',
          message: `Phiên bản ${latestVersion} đã được phát hành. Nhấn để cập nhật.`,
          priority: 2,
          buttons: [
            { title: 'Cập nhật ngay' }
          ]
        });
      }
    })
    .catch(error => {
      console.error('Error checking for updates:', error);
    });
}

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'update-notification' && buttonIndex === 0) {
    chrome.tabs.create({ url: 'https://github.com/Let-AI-Cook/Facebook-Extended/' });
  }
});

chrome.runtime.onStartup.addListener(() => {
  badgeCount = 0;
  updateBadgeText();
  checkForUpdates();
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install" || details.reason === "update") {
    badgeCount = 0;
    updateBadgeText();
    checkForUpdates();
  }
});
