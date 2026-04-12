import { getAllTimeData, clearAllData } from "../utils/storage.js";
import {
  getDayData,
  getWeekData,
  getMonthData,
  getYearData,
  formatTime,
  downloadFormatTime,
  todayKey,
} from "../utils/time.js";

const COLORS = [
  "#4ade80",
  "#f472b6",
  "#6367FF",
  "#f59c53",
  "#F5CBCB",
  "#e75a5a",
  "#E4FF30",
  "#facc15",
  "#60a5fa",
  "#c084fc",
  "#34d399",
  "#f87171",
  "#932F67",
  "#38bdf8",
  "#a78bfa",
  "#FEC7B4",
  "#B8DB80",
  "#F875AA",
  "#EDA35A",
  "#FFDE42",
  "#fca4a4",
];

let totalMs = 0;
let currentRange = "day";
let chartInstance = null;

// helper functions
async function getLiveSession() {
  try {
    return await chrome.runtime.sendMessage({ type: "GET_LIVE_SESSION" });
  } catch {
    return {};
  }
}

function mergeLive(data, live) {
  if (!live || !Object.keys(live).length) return data;
  const merged = { ...data };
  for (const [host, ms] of Object.entries(live)) {
    merged[host] = (merged[host] || 0) + ms;
  }
  return merged;
}

function renderChart(sites) {
  const labels = sites.map(([hostname]) => hostname);
  const values = sites.map(([, ms]) => ms);
  const colors = sites.map((_, i) => COLORS[i % COLORS.length]);

  if (chartInstance) chartInstance.destroy();

  const ctx = document.getElementById("chart").getContext("2d");

  Chart.Tooltip.positioners.outside = function (elements) {
    if (!elements.length) return false;
    const arc = elements[0].element;
    const angle = (arc.startAngle + arc.endAngle) / 2;
    const x = arc.x + Math.cos(angle) * (arc.outerRadius + 36);
    const y = arc.y + Math.sin(angle) * (arc.outerRadius + 36);
    return { x, y };
  };

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: "#121715",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "70%",

      plugins: {
        legend: { display: false },
        tooltip: {
          position: "outside",
          callbacks: {
            label: (item) => {
              const pct =
                totalMs > 0 ? ((item.raw / totalMs) * 100).toFixed(1) : 0;
              return ` ${pct}%`;
            },
          },
        },
      },
    },
  });
}

function renderList(sites) {
  const container = document.getElementById("siteList");
  container.innerHTML = "";

  if (sites.length === 0) {
    container.innerHTML = '<p class="empty">NO DATA YET</p>';
    return;
  }

  sites.forEach(([hostname, ms], i) => {
    const row = document.createElement("div");
    row.className = "site-row";
    row.innerHTML = `
      <div class="site-dot" style="background: ${COLORS[i % COLORS.length]}"></div>
      <span class="site-name">${hostname}</span>
      <span class="site-time">${formatTime(ms)}</span>
    `;
    container.appendChild(row);
  });
}

// main
async function render() {
  const timeData = await getAllTimeData();
  const live = await getLiveSession();

  let data;
  if (currentRange === "day") data = mergeLive(getDayData(timeData), live);
  else if (currentRange === "week")
    data = mergeLive(getWeekData(timeData), live);
  else if (currentRange === "month")
    data = mergeLive(getMonthData(timeData), live);
  else data = mergeLive(getYearData(timeData), live);

  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  totalMs = sorted.reduce((sum, [, ms]) => sum + ms, 0);
  document.getElementById("totalTime").textContent = formatTime(totalMs);

  renderChart(sorted);
  renderList(sorted);
}

// Dom
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentRange = tab.dataset.range;
    render();
  });
});

document.getElementById("downloadBtn").addEventListener("click", async () => {
  const timeData = await getAllTimeData();
  const live = await getLiveSession();
  const today = todayKey();

  let data, label, filename;

  if (currentRange === "day") {
    data = mergeLive(getDayData(timeData), live);
    label = `Daily · ${today}`;
    filename = `LAPSE-daily-${today}.csv`;
  } else if (currentRange === "week") {
    data = mergeLive(getWeekData(timeData), live);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const ws = weekStart.toISOString().split("T")[0];
    label = `Weekly · ${ws} to ${today}`;
    filename = `LAPSE-weekly-${ws}.csv`;
  } else if (currentRange === "month") {
    data = mergeLive(getMonthData(timeData), live);
    const d = new Date();
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    label = `Monthly · ${month}`;
    filename = `LAPSE-monthly-${month}.csv`;
  } else {
    data = mergeLive(getYearData(timeData), live);
    label = `Yearly · ${new Date().getFullYear()}`;
    filename = `LAPSE-yearly-${new Date().getFullYear()}.csv`;
  }

  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const csv =
    `Site,Time (${label})\n` +
    entries.map(([h, ms]) => `${h},${downloadFormatTime(ms)}`).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("clearBtn").addEventListener("click", async () => {
  const confirmed = confirm("Clear all tracking data?");
  if (!confirmed) return;
  await clearAllData();
  render();
});

// call
render();
