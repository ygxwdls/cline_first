import { app } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { LibraryData } from '@shared/types'

const DEFAULT_DATA: LibraryData = {
  books: [],
  progress: {},
  bookmarks: {},
  stats: {},
  settings: {
    fontSize: 16,
    theme: 'day'
  }
}

/**
 * 极简 JSON 持久化仓库。
 * 起步阶段数据量小，直接读写单个 JSON 文件即可；后续书多了再换 better-sqlite3。
 */
export class LibraryStore {
  private data: LibraryData
  private readonly filePath: string
  private writeChain: Promise<void> = Promise.resolve()

  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'library.json')
    this.data = structuredClone(DEFAULT_DATA)
  }

  async init(): Promise<void> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8')
      const parsed = JSON.parse(raw) as Partial<LibraryData>
      this.data = {
        books: parsed.books ?? [],
        progress: parsed.progress ?? {},
        bookmarks: parsed.bookmarks ?? {},
        stats: parsed.stats ?? {},
        settings: {
          ...DEFAULT_DATA.settings,
          ...(parsed.settings ?? {})
        }
      }
    } catch {
      // 文件不存在或损坏时使用默认数据，不阻塞启动。
    }
  }

  get(): LibraryData {
    return this.data
  }

  /** 修改内存数据并串行落盘，避免并发写坏文件。 */
  update(mutator: (data: LibraryData) => void): Promise<void> {
    mutator(this.data)
    this.writeChain = this.writeChain.then(() => this.persist())
    return this.writeChain
  }

  /** 退出前确保所有排队写入完成。 */
  async flush(): Promise<void> {
    await this.writeChain
  }

  private async persist(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
    const tmpPath = `${this.filePath}.tmp`
    await fs.writeFile(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8')
    await fs.rename(tmpPath, this.filePath)
  }
}
