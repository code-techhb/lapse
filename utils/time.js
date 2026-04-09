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

export function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
}
