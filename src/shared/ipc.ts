import type {
  Book,
  Bookmark,
  LibraryData,
  ProgressEntry,
  ReadingStats,
  Settings
} from './types'

export const IPC = {
  GetLibrary: 'library:get',
  ImportBook: 'books:import',
  RemoveBook: 'books:remove',
  ReadBook: 'books:read',
  GetCover: 'books:cover',
  SaveProgress: 'progress:save',
  SaveBookmarks: 'bookmarks:save',
  SaveStats: 'stats:save',
  SaveSettings: 'settings:save',
  FlushRequest: 'app:flush',
  Flushed: 'app:flushed'
} as const

export interface ReaderApi {
  getLibrary(): Promise<LibraryData>
  importBook(): Promise<Book | null>
  removeBook(id: string): Promise<void>
  readBook(id: string): Promise<ArrayBuffer>
  getCover(id: string): Promise<string | null>
  saveProgress(id: string, entry: ProgressEntry): Promise<void>
  saveBookmarks(id: string, bookmarks: Bookmark[]): Promise<void>
  saveStats(id: string, stats: ReadingStats): Promise<void>
  saveSettings(settings: Settings): Promise<void>
  /** 主进程请求渲染层立即回写进度，返回取消订阅函数 */
  onFlushRequest(callback: () => void): () => void
  notifyFlushed(): void
}
