import { app, ipcMain, type BrowserWindow } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { IPC } from '@shared/ipc'
import type { Bookmark, ProgressEntry, ReadingStats, Settings } from '@shared/types'
import type { LibraryStore } from './library'
import { chooseEpub, importEpub, readCoverAsDataUrl, readEpubFile } from './books'

export function registerIpc(
  store: LibraryStore,
  getWindow: () => BrowserWindow | null
): void {
  ipcMain.handle(IPC.GetLibrary, () => store.get())

  ipcMain.handle(IPC.ImportBook, async () => {
    const win = getWindow()
    if (!win) return null
    const filePath = await chooseEpub(win)
    if (!filePath) return null

    const book = await importEpub(filePath)
    await store.update((data) => {
      data.books.unshift(book)
      data.progress[book.id] = { cfi: '', percent: 0, updatedAt: Date.now() }
      data.bookmarks[book.id] = []
      data.stats[book.id] = { totalSeconds: 0, lastReadAt: Date.now() }
    })
    return book
  })

  ipcMain.handle(IPC.RemoveBook, async (_event, id: string) => {
    const book = store.get().books.find((item) => item.id === id)
    await store.update((data) => {
      data.books = data.books.filter((item) => item.id !== id)
      delete data.progress[id]
      delete data.bookmarks[id]
      delete data.stats[id]
    })

    if (book) {
      const booksDir = path.join(app.getPath('userData'), 'books')
      await fs.rm(path.join(booksDir, `${id}.epub`), { force: true })
      if (book.coverPath) {
        await fs.rm(book.coverPath, { force: true })
      }
    }
  })

  ipcMain.handle(IPC.ReadBook, (_event, id: string) => readEpubFile(id))

  ipcMain.handle(IPC.GetCover, (_event, id: string) => {
    const book = store.get().books.find((item) => item.id === id)
    return book ? readCoverAsDataUrl(book) : null
  })

  ipcMain.handle(IPC.SaveProgress, (_event, id: string, entry: ProgressEntry) =>
    store.update((data) => {
      data.progress[id] = entry
      const book = data.books.find((item) => item.id === id)
      if (book) book.lastReadAt = entry.updatedAt
    })
  )

  ipcMain.handle(IPC.SaveBookmarks, (_event, id: string, bookmarks: Bookmark[]) =>
    store.update((data) => {
      data.bookmarks[id] = bookmarks
    })
  )

  ipcMain.handle(IPC.SaveStats, (_event, id: string, stats: ReadingStats) =>
    store.update((data) => {
      data.stats[id] = stats
    })
  )

  ipcMain.handle(IPC.SaveSettings, (_event, settings: Settings) =>
    store.update((data) => {
      data.settings = settings
    })
  )
}
