const clock = document.getElementById("clock");
const date = document.getElementById("date");

const alarmTime =
  document.getElementById("alarmTime");

const alarmLabel =
  document.getElementById("alarmLabel");

const addAlarm =
  document.getElementById("addAlarm");

const alarmList =
  document.getElementById("alarmList");

const alarmSound =
  document.getElementById("alarmSound");

const stopAlarm =
  document.getElementById("stopAlarm");

const alarmCount =
  document.getElementById("alarmCount");

const nextAlarm =
  document.getElementById("nextAlarm");

const themeBtn =
  document.getElementById("themeBtn");

let alarms = [];
let triggeredAlarms = [];

/* CLOCK */

function updateClock() {

  const now = new Date();

  clock.textContent =
    now.toLocaleTimeString();

  date.textContent =
    now.toDateString();

}

updateClock();

setInterval(() => {

  updateClock();

  checkAlarm();

}, 1000);

/* STATS */

function updateStats() {

  alarmCount.textContent =
    alarms.length;

  if (alarms.length === 0) {

    nextAlarm.textContent =
      "None";

  } else {

    nextAlarm.textContent =
      alarms[0].time;

  }

}

/* RENDER */

function renderAlarms() {

  alarmList.innerHTML = "";

  alarms.forEach((alarm, index) => {

    const li =
      document.createElement("li");

    const info =
      document.createElement("span");

    info.textContent =
      `${alarm.time} - ${alarm.label}`;

    if (!alarm.active) {

      info.style.opacity =
        "0.5";

    }

    /* TOGGLE */

    const toggleBtn =
      document.createElement("button");

    toggleBtn.textContent =
      alarm.active
        ? "Disable"
        : "Enable";

    toggleBtn.addEventListener(
      "click",
      () => {

        alarm.active =
          !alarm.active;

        renderAlarms();

      }
    );

    /* EDIT */

    const editBtn =
      document.createElement("button");

    editBtn.textContent =
      "Edit";

    editBtn.addEventListener(
      "click",
      () => {

        const newLabel =
          prompt(
            "Edit Alarm Label",
            alarm.label
          );

        if (newLabel !== null) {

          alarm.label =
            newLabel;

          renderAlarms();

        }

      }
    );

    /* DELETE */

    const deleteBtn =
      document.createElement("button");

    deleteBtn.textContent =
      "Delete";

    deleteBtn.addEventListener(
      "click",
      () => {

        alarms.splice(
          index,
          1
        );

        renderAlarms();

      }
    );

    li.appendChild(info);
    li.appendChild(toggleBtn);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    alarmList.appendChild(li);

  });

  updateStats();

}

/* ADD */

addAlarm.addEventListener(
  "click",
  () => {

    if (!alarmTime.value) return;

    alarms.push({

      time:
        alarmTime.value,

      label:
        alarmLabel.value.trim() ||
        "No Label",

      active: true

    });

    renderAlarms();

    alarmTime.value = "";
    alarmLabel.value = "";

  }
);

/* CHECK */

function checkAlarm() {

  const now = new Date();

  const currentTime =
    `${String(now.getHours())
      .padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

  alarms.forEach((alarm) => {

    if (
      alarm.active &&
      alarm.time === currentTime &&
      !triggeredAlarms.includes(alarm)
    ) {

          triggeredAlarms.push(
        alarm
      );

      alarm.active = false;

      renderAlarms();

      return;

      alarmSound.currentTime = 0;

      alarmSound.loop = true;

      alarmSound.play();

      window.alarmAPI
        .showNotification(
          `Alarm: ${alarm.label}`
        );

    }

  });

}

/* STOP */

stopAlarm.addEventListener(
  "click",
  () => {

    alarmSound.pause();

    alarmSound.currentTime = 0;

    alarmSound.loop = false;

  }
);

/* DARK MODE */

themeBtn.addEventListener(
  "click",
  () => {

    document.body.classList.toggle(
      "dark"
    );

    if (
      document.body.classList.contains(
        "dark"
      )
    ) {

      themeBtn.textContent =
        "☀ Light Mode";

    } else {

      themeBtn.textContent =
        "🌙 Dark Mode";

    }

  }
);