import { getHostname, todayKey } from "./utils/time.js";

let activeHostname = null;
let sessionStart = null;
let isWindowFocused = true;

async function saveSession() {
  if (!activeHostname || !sessionStart) return;

  const elapsed = Date.now() - sessionStart;
  if (elapsed <= 0) return;

  const today = todayKey();
  const result = await chrome.storage.local.get("timeData");
  const timeData = result.timeData || {};

  if (!timeData[today]) timeData[today] = {};
  timeData[today][activeHostname] =
    (timeData[today][activeHostname] || 0) + elapsed;

  await chrome.storage.local.set({ timeData });
}

async function startTracking(hostname) {
  await saveSession();

  activeHostname = hostname || null;
  sessionStart = hostname ? Date.now() : null;
}

function scheduleMidnightAlarm() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight - now;

  chrome.alarms.create("midnightCleanup", {
    delayInMinutes: msUntilMidnight / 60000,
    periodInMinutes: 1440,
  });
}

async function cleanOldData() {
  const result = await chrome.storage.local.get("timeData");
  const timeData = result.timeData || {};

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  for (const date of Object.keys(timeData)) {
    if (new Date(date) < cutoff) {
      delete timeData[date];
    }
  }

  await chrome.storage.local.set({ timeData });
}

// chrome
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!isWindowFocused) return;
  const tab = await chrome.tabs.get(tabId);
  await startTracking(getHostname(tab.url));
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!isWindowFocused) return;
  if (changeInfo.status !== "complete") return;
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!activeTab || activeTab.id !== tabId) return;
  await startTracking(getHostname(tab.url));
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    isWindowFocused = false;
    await startTracking(null);
  } else {
    isWindowFocused = true;
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    await startTracking(getHostname(activeTab?.url));
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "midnightCleanup") {
    cleanOldData();
  }
});

chrome.idle.onStateChanged.addListener(async (state) => {
  if (state === "idle" || state === "locked") {
    await startTracking(null);
  } else if (state === "active") {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    await startTracking(getHostname(activeTab?.url));
  }
});

chrome.runtime.onSuspend.addListener(async () => {
  await saveSession();
});

// init
scheduleMidnightAlarm();
chrome.idle.setDetectionInterval(180);
