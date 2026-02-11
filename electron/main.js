const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

// 生产模式下才在 Electron 内启动后端，开发模式由 concurrently 单独启动
if (!isDev) {
  require('../server/index.js');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'SciTools - 科研工具箱',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (isDev) {
    // 开发模式：加载 Vite dev server
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // 生产模式：加载构建后的文件（通过 Express 服务）
    const config = require('../server/config');
    win.loadURL(`http://localhost:${config.port}`);
  }

  win.on('closed', () => {
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
