export function getHostname(url) {
  if (!url) return null;
  try {
    const { hostname, protocol } = new URL(url);
    if (!["http:", "https:"].includes(protocol)) return null;
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function downloadFormatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) return `${hours}h ${mm}m ${ss}s`;
  if (minutes > 0) return `${mm}m ${ss}s`;
  return `${ss}s`;
}

export function getDayData(timeData, date = todayKey()) {
  return timeData[date] || {};
}

export function getWeekData(timeData) {
  const result = {};
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayData = timeData[key] || {};

    for (const [hostname, ms] of Object.entries(dayData)) {
      result[hostname] = (result[hostname] || 0) + ms;
    }
  }

  return result;
}

export function getMonthData(timeData) {
  const result = {};
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  for (const [date, dayData] of Object.entries(timeData)) {
    if (!date.startsWith(`${year}-${month}`)) continue;

    for (const [hostname, ms] of Object.entries(dayData)) {
      result[hostname] = (result[hostname] || 0) + ms;
    }
  }

  return result;
}

export function getYearData(timeData) {
  const result = {};
  const year = String(new Date().getFullYear());

  for (const [date, dayData] of Object.entries(timeData)) {
    if (!date.startsWith(year)) continue;

    for (const [hostname, ms] of Object.entries(dayData)) {
      result[hostname] = (result[hostname] || 0) + ms;
    }
  }

  return result;
}

export function pruneOldData(timeData) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const cutoffKey = cutoff.toISOString().split("T")[0];

  const pruned = {};
  for (const [date, data] of Object.entries(timeData)) {
    if (date >= cutoffKey) pruned[date] = data;
  }
  return pruned;
}
