import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Book,
  Bookmark,
  LibraryData,
  ProgressEntry,
  ReadingStats
} from '@shared/types'

export const useLibraryStore = defineStore('library', () => {
  const loaded = ref(false)
  const books = ref<Book[]>([])
  const progress = ref<Record<string, ProgressEntry>>({})
  const bookmarks = ref<Record<string, Bookmark[]>>({})
  const stats = ref<Record<string, ReadingStats>>({})

  async function init(): Promise<LibraryData> {
    const data = await window.api.getLibrary()
    books.value = data.books
    progress.value = data.progress
    bookmarks.value = data.bookmarks
    stats.value = data.stats
    loaded.value = true
    return data
  }

  async function importBook(): Promise<Book | null> {
    const book = await window.api.importBook()
    if (book) {
      books.value = [book, ...books.value.filter((item) => item.id !== book.id)]
      progress.value[book.id] = { cfi: '', percent: 0, updatedAt: Date.now() }
      bookmarks.value[book.id] = []
      stats.value[book.id] = { totalSeconds: 0, lastReadAt: Date.now() }
    }
    return book
  }

  async function removeBook(id: string): Promise<void> {
    await window.api.removeBook(id)
    books.value = books.value.filter((item) => item.id !== id)
    delete progress.value[id]
    delete bookmarks.value[id]
    delete stats.value[id]
  }

  function progressOf(id: string): number {
    return progress.value[id]?.percent ?? 0
  }

  async function saveProgress(id: string, entry: ProgressEntry): Promise<void> {
    progress.value[id] = entry
    const book = books.value.find((item) => item.id === id)
    if (book) book.lastReadAt = entry.updatedAt
    await window.api.saveProgress(id, entry)
  }

  async function saveBookmarks(id: string, list: Bookmark[]): Promise<void> {
    bookmarks.value[id] = list
    await window.api.saveBookmarks(id, list)
  }

  async function saveStats(id: string, value: ReadingStats): Promise<void> {
    stats.value[id] = value
    await window.api.saveStats(id, value)
  }

  return {
    loaded,
    books,
    progress,
    bookmarks,
    stats,
    init,
    importBook,
    removeBook,
    progressOf,
    saveProgress,
    saveBookmarks,
    saveStats
  }
})
