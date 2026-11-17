const {
  contextBridge,
  ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
  "alarmAPI",
  {
    showNotification: (message) =>
      ipcRenderer.invoke(
        "show-notification",
        message
      ),

    saveAlarms: (alarms) =>
      ipcRenderer.invoke(
        "save-alarms",
        alarms
      ),

    loadAlarms: () =>
      ipcRenderer.invoke(
        "load-alarms"
      )
  }
);