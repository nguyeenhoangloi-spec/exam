const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

// 1. Single Instance Lock (Tranh mo nhieu cua so trung lap)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let splashWindow = null;
let backendProcess = null;
let frontendProcess = null;

const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';

function checkServerReady(url, maxRetries = 40, interval = 500) {
  return new Promise((resolve) => {
    let retries = 0;
    const intervalId = setInterval(() => {
      http.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          clearInterval(intervalId);
          resolve(true);
        }
      }).on('error', () => {
        retries++;
        if (retries >= maxRetries) {
          clearInterval(intervalId);
          resolve(false);
        }
      });
    }, interval);
  });
}

function startServices() {
  const rootDir = app.isPackaged 
    ? path.join(process.resourcesPath, 'app-dist') 
    : path.resolve(__dirname, '..');

  const backendDir = app.isPackaged
    ? path.join(process.resourcesPath, 'app-dist', 'backend')
    : path.join(rootDir, 'backend');

  const frontendDir = app.isPackaged
    ? path.join(process.resourcesPath, 'app-dist', 'frontend')
    : path.join(rootDir, 'frontend');

  console.log('[Electron] Starting background services with ELECTRON_RUN_AS_NODE=1...');

  // 1. Start Backend (Chay Node thuần trong Electron)
  try {
    const backendEntry = path.join(backendDir, 'dist', 'src', 'main.js');
    backendProcess = spawn(process.execPath, [backendEntry], {
      cwd: backendDir,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        PORT: '3001',
        NODE_ENV: 'production'
      },
      stdio: 'ignore'
    });
  } catch (err) {
    console.warn('[Electron] Backend start warning:', err.message);
  }

  // 2. Start Frontend Standalone
  try {
    const frontendServer = path.join(frontendDir, 'server.js');
    frontendProcess = spawn(process.execPath, [frontendServer], {
      cwd: frontendDir,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        PORT: '3000',
        NODE_ENV: 'production',
        HOSTNAME: '0.0.0.0'
      },
      stdio: 'ignore'
    });
  } catch (err) {
    console.warn('[Electron] Frontend start warning:', err.message);
  }
}

function stopServices() {
  console.log('[Electron] Cleaning up child processes...');
  if (backendProcess) {
    try { backendProcess.kill(); } catch (e) {}
    backendProcess = null;
  }
  if (frontendProcess) {
    try { frontendProcess.kill(); } catch (e) {}
    frontendProcess = null;
  }
}

const iconPath = path.join(__dirname, 'assets', 'icon.png');

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 460,
    height: 340,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    backgroundColor: '#00000000',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    title: 'Hệ Thống Quản Lý Khảo Thí - Exam Management System',
    backgroundColor: '#f8fafc',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const menuTemplate = [
    {
      label: 'Hệ Thống',
      submenu: [
        { label: 'Tải lại trang (Reload)', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'Tải lại toàn bộ (Hard Reload)', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow.webContents.reloadIgnoringCache() },
        { type: 'separator' },
        { label: 'Thoát ứng dụng', accelerator: 'Alt+F4', click: () => app.quit() }
      ]
    },
    {
      label: 'Xem',
      submenu: [
        { label: 'Phóng to', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Thu nhỏ', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Tỷ lệ mặc định', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Toàn màn hình (F11)', accelerator: 'F11', role: 'togglefullscreen' },
        ...(isDev ? [{ label: 'Công cụ phát triển (DevTools)', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() }] : [])
      ]
    },
    {
      label: 'Trợ Giúp',
      submenu: [
        {
          label: 'Về Hệ Thống Khảo Thí',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              icon: iconPath,
              title: 'Exam Management System',
              message: 'Hệ Thống Quản Lý Khảo Thí Sinh Viên v1.0.0',
              detail: 'Ứng dụng Native Desktop phục vụ tổ chức thi và quản lý khảo thí toàn diện.\nPhát triển trên nền tảng NestJS, Next.js và Electron.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Cho server khoi dong va nạp URL
  await checkServerReady(FRONTEND_URL, 30, 500);

  mainWindow.loadURL(FRONTEND_URL);

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  createSplashWindow();
  startServices();
  await createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopServices();
    app.quit();
  }
});

app.on('before-quit', () => {
  stopServices();
});

process.on('exit', () => {
  stopServices();
});
