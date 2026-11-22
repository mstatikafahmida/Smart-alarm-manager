const {
  app,
  BrowserWindow,
  Notification,
  ipcMain,
  Tray,
  Menu,
  nativeImage
} = require("electron");

const path = require("path");
const fs = require("fs");

const dataFile = path.join(
  app.getPath("userData"),
  "alarms.json"
);

let mainWindow = null;
let tray = null;
let isQuitting = false;

function getTrayIcon() {
  const iconPath = path.join(__dirname, "icon.png");
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }
  return nativeImage.createEmpty();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile("index.html");

  
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();

      new Notification({
        title: "⏰ Smart Alarm Manager",
        body: "App is running in background. Alarms will still ring!"
      }).show();
    }
  });
}

function createTray() {
  tray = new Tray(getTrayIcon());
  tray.setToolTip("Smart Alarm Manager");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Alarm Manager",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: "separator" },
    {
      label: "Quit Completely",
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId("Smart Alarm Manager");
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

/* Notification */
ipcMain.handle("show-notification", (event, message) => {
  new Notification({
    title: "⏰ Smart Alarm",
    body: message
  }).show();
});

/* Save Alarm */
ipcMain.handle("save-alarms", (event, alarms) => {
  fs.writeFileSync(dataFile, JSON.stringify(alarms, null, 2));
  return true;
});

/* Load Alarm */
ipcMain.handle("load-alarms", () => {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, "utf8");
      return data ? JSON.parse(data) : [];
    }
  } catch (error) {
    console.error("Alarm load error:", error);
  }
  return [];
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && isQuitting) {
    app.quit();
  }
});