import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Route = { name: 'bookshelf' } | { name: 'reader'; bookId: string }

export const useUiStore = defineStore('ui', () => {
  const route = ref<Route>({ name: 'bookshelf' })

  function openBook(bookId: string): void {
    route.value = { name: 'reader', bookId }
  }

  function goBookshelf(): void {
    route.value = { name: 'bookshelf' }
  }

  return { route, openBook, goBookshelf }
})
