import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { LibraryStore } from './library'
import { registerIpc } from './ipc'
import { IPC } from '@shared/ipc'

let mainWindow: BrowserWindow | null = null
let quitting = false

const store = new LibraryStore()

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 860,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f2f5f1',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

async function flushAndQuit(): Promise<void> {
  const win = mainWindow
  if (win && !win.isDestroyed()) {
    win.webContents.send(IPC.FlushRequest)
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 800)
      ipcMain.once(IPC.Flushed, () => {
        clearTimeout(timer)
        resolve()
      })
    })
  }
  await store.flush()
  app.exit(0)
}

void app.whenReady().then(async () => {
  await store.init()
  registerIpc(store, () => mainWindow)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', (event) => {
  if (quitting) return
  event.preventDefault()
  quitting = true
  void flushAndQuit()
})
