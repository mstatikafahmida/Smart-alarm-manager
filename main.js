const {
  app,
  BrowserWindow,
  Notification,
  ipcMain
} = require("electron");

const path = require("path");
const fs = require("fs");

const dataFile = path.join(
  app.getPath("userData"),
  "alarms.json"
);

function createWindow() {

  const win = new BrowserWindow({
    width: 1100,
    height: 750,

    webPreferences: {
      preload: path.join(
        __dirname,
        "preload.js"
      ),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();
});

/* Notification */

ipcMain.handle(
  "show-notification",
  (event, message) => {

    new Notification({
      title: "⏰ Smart Alarm",
      body: message
    }).show();

  }
);

/* Save Alarm */

ipcMain.handle(
  "save-alarms",
  (event, alarms) => {

    fs.writeFileSync(
      dataFile,
      JSON.stringify(
        alarms,
        null,
        2
      )
    );

    return true;

  }
);

/* Load Alarm */

ipcMain.handle(
  "load-alarms",
  () => {

    if (
      fs.existsSync(dataFile)
    ) {

      return JSON.parse(
        fs.readFileSync(
          dataFile,
          "utf8"
        )
      );

    }

    return [];

  }
);

app.on(
  "window-all-closed",
  () => {

    if (
      process.platform !==
      "darwin"
    ) {

      app.quit();

    }

  }
);