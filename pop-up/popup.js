import { getAllTimeData, clearAllData } from "../utils/storage.js";
import {
  getDayData,
  getWeekData,
  getMonthData,
  getYearData,
  formatTime,
} from "../utils/time.js";

const COLORS = [
  "#4ade80",
  "#f472b6",
  "#fb923c",
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
];

let currentRange = "day";
let chartInstance = null;

// helper functions
function renderChart(sites) {
  const labels = sites.map(([hostname]) => hostname);
  const values = sites.map(([, ms]) => ms);
  const colors = sites.map((_, i) => COLORS[i % COLORS.length]);

  if (chartInstance) chartInstance.destroy();

  const ctx = document.getElementById("chart").getContext("2d");

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
          callbacks: {
            label: (item) => ` ${formatTime(item.raw)}`,
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

  let data;
  if (currentRange === "day") data = getDayData(timeData);
  else if (currentRange === "week") data = getWeekData(timeData);
  else if (currentRange === "month") data = getMonthData(timeData);
  else data = getYearData(timeData);

  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((sum, [, ms]) => sum + ms, 0);

  document.getElementById("totalTime").textContent = formatTime(total);

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
  const json = JSON.stringify(timeData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Lapse-browsing-time-${new Date().toISOString().split("T")[0]}.json`;
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
