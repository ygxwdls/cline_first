import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type ReaderApi } from '@shared/ipc'

const api: ReaderApi = {
  getLibrary: () => ipcRenderer.invoke(IPC.GetLibrary),
  importBook: () => ipcRenderer.invoke(IPC.ImportBook),
  removeBook: (id) => ipcRenderer.invoke(IPC.RemoveBook, id),
  readBook: (id) => ipcRenderer.invoke(IPC.ReadBook, id),
  getCover: (id) => ipcRenderer.invoke(IPC.GetCover, id),
  saveProgress: (id, entry) => ipcRenderer.invoke(IPC.SaveProgress, id, entry),
  saveBookmarks: (id, bookmarks) => ipcRenderer.invoke(IPC.SaveBookmarks, id, bookmarks),
  saveStats: (id, stats) => ipcRenderer.invoke(IPC.SaveStats, id, stats),
  saveSettings: (settings) => ipcRenderer.invoke(IPC.SaveSettings, settings),
  onFlushRequest: (callback) => {
    const listener = (): void => callback()
    ipcRenderer.on(IPC.FlushRequest, listener)
    return () => ipcRenderer.removeListener(IPC.FlushRequest, listener)
  },
  notifyFlushed: () => ipcRenderer.send(IPC.Flushed)
}

contextBridge.exposeInMainWorld('api', api)
