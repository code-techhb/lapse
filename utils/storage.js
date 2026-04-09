export async function getAllTimeData() {
  const result = await chrome.storage.local.get("timeData");
  return result.timeData || {};
}

export async function clearAllData() {
  await chrome.storage.local.remove("timeData");
}
