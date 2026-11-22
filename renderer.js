const clock = document.getElementById("clock");
const date = document.getElementById("date");
const alarmTime = document.getElementById("alarmTime");
const alarmLabel = document.getElementById("alarmLabel");
const addAlarm = document.getElementById("addAlarm");
const alarmList = document.getElementById("alarmList");
const alarmSound = document.getElementById("alarmSound");
const stopAlarm = document.getElementById("stopAlarm");
const snoozeBtn = document.getElementById("snoozeBtn");
const ringingBanner = document.getElementById("ringingBanner");
const ringingTitle = document.getElementById("ringingTitle");
const ringingTime = document.getElementById("ringingTime");
const alarmCount = document.getElementById("alarmCount");
const nextAlarm = document.getElementById("nextAlarm");
const countdownText = document.getElementById("countdownText");
const themeBtn = document.getElementById("themeBtn");
const dayCheckboxes = document.querySelectorAll("#daysContainer input[type='checkbox']");

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let alarms = [];

/* SAVE & LOAD */
async function saveToDisk() {
  if (window.alarmAPI && window.alarmAPI.saveAlarms) {
    await window.alarmAPI.saveAlarms(alarms);
  }
}

async function loadFromDisk() {
  if (window.alarmAPI && window.alarmAPI.loadAlarms) {
    const saved = await window.alarmAPI.loadAlarms();
    if (Array.isArray(saved)) {
      alarms = saved.map((a) => ({
        ...a,
        days: Array.isArray(a.days) ? a.days : [],
        ringing: false
      }));
      renderAlarms();
    }
  }
}

/* CLOCK & COUNTDOWN */
function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString();
  date.textContent = now.toDateString();
  updateCountdown(now);
}

function getSelectedDays() {
  return Array.from(dayCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => Number(cb.value));
}

function clearSelectedDays() {
  dayCheckboxes.forEach((cb) => {
    cb.checked = false;
  });
}

function formatDays(days) {
  if (!days || days.length === 0) return "Once";
  if (days.length === 7) return "Daily";
  return days.map((d) => DAY_NAMES[d]).join(", ");
}

function getNextOccurrence(alarm, now) {
  const [hours, minutes] = alarm.time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  if (!alarm.days || alarm.days.length === 0) {
    const candidate = new Date(now);
    candidate.setHours(hours, minutes, 0, 0);
    if (candidate <= now) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate;
  }

  let closest = null;
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    candidate.setHours(hours, minutes, 0, 0);

    if (alarm.days.includes(candidate.getDay()) && candidate > now) {
      if (!closest || candidate < closest) {
        closest = candidate;
      }
    }
  }
  return closest;
}

function updateCountdown(now = new Date()) {
  const activeAlarms = alarms.filter((a) => a.active);
  if (activeAlarms.length === 0) {
    nextAlarm.textContent = "None";
    countdownText.textContent = "--";
    return;
  }

  let nearestAlarm = null;
  let nearestDate = null;

  for (const alarm of activeAlarms) {
    const occ = getNextOccurrence(alarm, now);
    if (occ && (!nearestDate || occ < nearestDate)) {
      nearestDate = occ;
      nearestAlarm = alarm;
    }
  }

  if (!nearestAlarm || !nearestDate) {
    nextAlarm.textContent = "None";
    countdownText.textContent = "--";
    return;
  }

  nextAlarm.textContent = `${nearestAlarm.time} (${nearestAlarm.label})`;

  const diffMs = Math.max(0, nearestDate - now);
  const totalSeconds = Math.floor(diffMs / 1000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  countdownText.textContent = `${hrs}h ${mins}m ${secs}s`;
}

/* STATS */
function updateStats() {
  alarmCount.textContent = alarms.length;
  updateCountdown(new Date());
}

/* RINGING POPUP UI */
function showRingingPopup(alarm) {
  ringingTitle.textContent = alarm.label;
  ringingTime.textContent = `Time: ${alarm.time}`;
  ringingBanner.classList.remove("hidden");
  document.title = `🔔 RINGING: ${alarm.label}`;
}

function hideRingingPopup() {
  ringingBanner.classList.add("hidden");
  document.title = "Smart Alarm Manager";
}

function stopAudioOnly() {
  if (alarmSound) {
    alarmSound.pause();
    alarmSound.currentTime = 0;
    alarmSound.loop = false;
  }
  hideRingingPopup();
}

/* RENDER */
function renderAlarms() {
  alarmList.innerHTML = "";

  alarms.forEach((alarm, index) => {
    const li = document.createElement("li");
    if (alarm.ringing) {
      li.classList.add("ringing-item");
    }

    const info = document.createElement("span");
    info.textContent = `${alarm.time} - ${alarm.label} [${formatDays(alarm.days)}]`;

    if (!alarm.active) {
      info.style.opacity = "0.5";
    }

    /* TOGGLE (Enable / Disable) */
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = alarm.active ? "Disable" : "Enable";
    toggleBtn.addEventListener("click", async () => {
      if (alarm.active) {
        alarm.active = false;
        if (alarm.ringing) {
          alarm.ringing = false;
          stopAudioOnly();
        }
      } else {
        alarm.active = true;
        alarm.ringing = false;
        alarm.lastTriggeredKey = null;
      }

      renderAlarms();
      await saveToDisk();
    });

    /* EDIT */
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", async () => {
      const newLabel = prompt("Edit Alarm Label", alarm.label);
      if (newLabel !== null) {
        alarm.label = newLabel.trim() || "No Label";
        renderAlarms();
        await saveToDisk();
      }
    });

    /* DELETE */
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      if (alarm.ringing) {
        stopAudioOnly();
      }
      alarms.splice(index, 1);
      renderAlarms();
      await saveToDisk();
    });

    li.appendChild(info);
    li.appendChild(toggleBtn);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    alarmList.appendChild(li);
  });

  updateStats();
}

/* ADD */
addAlarm.addEventListener("click", async () => {
  if (!alarmTime.value) return;

  alarms.push({
    time: alarmTime.value,
    label: alarmLabel.value.trim() || "No Label",
    days: getSelectedDays(),
    active: true,
    ringing: false,
    lastTriggeredKey: null
  });

  renderAlarms();
  await saveToDisk();

  alarmTime.value = "";
  alarmLabel.value = "";
  clearSelectedDays();
});

/* CHECK ALARM */
async function checkAlarm() {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
  const todayDay = now.getDay();
  const minuteKey = `${now.toDateString()}_${currentTime}`;

  let changed = false;

  for (const alarm of alarms) {
    const hasRepeatDays = Array.isArray(alarm.days) && alarm.days.length > 0;
    const matchesDay = !hasRepeatDays || alarm.days.includes(todayDay);

    if (
      alarm.active &&
      matchesDay &&
      alarm.time === currentTime &&
      !alarm.ringing &&
      alarm.lastTriggeredKey !== minuteKey
    ) {
      alarm.ringing = true;
      alarm.lastTriggeredKey = minuteKey;
      changed = true;

      if (alarmSound) {
        alarmSound.currentTime = 0;
        alarmSound.loop = true;
        alarmSound.play().catch((err) => {
          console.error("Audio play error:", err);
        });
      }

      showRingingPopup(alarm);

      if (window.alarmAPI && window.alarmAPI.showNotification) {
        window.alarmAPI.showNotification(`Alarm: ${alarm.label} (${alarm.time})`);
      }
    }
  }

  if (changed) {
    renderAlarms();
    await saveToDisk();
  }
}

/* STOP */
stopAlarm.addEventListener("click", async () => {
  let changed = false;

  for (const alarm of alarms) {
    if (alarm.ringing) {
      alarm.ringing = false;
      const hasRepeatDays = Array.isArray(alarm.days) && alarm.days.length > 0;
      if (!hasRepeatDays) {
        alarm.active = false;
      }
      changed = true;
    }
  }

  stopAudioOnly();

  if (changed) {
    renderAlarms();
    await saveToDisk();
  }
});


snoozeBtn.addEventListener("click", async () => {
  const now = new Date();
  const snoozeTimeObj = new Date(now.getTime() + 5 * 60 * 1000);
  const snoozeTimeStr = `${String(snoozeTimeObj.getHours()).padStart(
    2,
    "0"
  )}:${String(snoozeTimeObj.getMinutes()).padStart(2, "0")}`;

  let snoozedLabel = "Alarm";

  for (const alarm of alarms) {
    if (alarm.ringing) {
      snoozedLabel = alarm.label.replace(/^Snooze:\s*/i, "");
      alarm.ringing = false;
      const hasRepeatDays = Array.isArray(alarm.days) && alarm.days.length > 0;
      if (!hasRepeatDays) {
        alarm.active = false;
      }
    }
  }

  stopAudioOnly();

  alarms.push({
    time: snoozeTimeStr,
    label: `Snooze: ${snoozedLabel}`,
    days: [],
    active: true,
    ringing: false,
    lastTriggeredKey: null
  });

  renderAlarms();
  await saveToDisk();
});

/* DARK MODE */
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    themeBtn.textContent = "☀ Light Mode";
  } else {
    themeBtn.textContent = "🌙 Dark Mode";
  }
});

/* START */
updateClock();
loadFromDisk();

setInterval(() => {
  updateClock();
  checkAlarm();
}, 1000);