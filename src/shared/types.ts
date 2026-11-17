export type ThemeMode = 'day' | 'night'

export interface Book {
  id: string
  title: string
  author: string
  /** 封面图片在应用数据目录中的绝对路径；没有封面时为 null */
  coverPath: string | null
  /** 导入时的原始文件名 */
  fileName: string
  importedAt: number
  lastReadAt: number
}

export interface ProgressEntry {
  /** epub.js 的 CFI 精确定位 */
  cfi: string
  /** 0..1 的百分比快照，用于书架展示 */
  percent: number
  updatedAt: number
}

export interface Bookmark {
  id: string
  cfi: string
  percent: number
  note: string
  createdAt: number
}

export interface ReadingStats {
  totalSeconds: number
  lastReadAt: number
}

export interface Settings {
  fontSize: number
  theme: ThemeMode
}

export interface LibraryData {
  books: Book[]
  progress: Record<string, ProgressEntry>
  bookmarks: Record<string, Bookmark[]>
  stats: Record<string, ReadingStats>
  settings: Settings
}
