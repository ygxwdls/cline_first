<script setup lang="ts">
import { computed, ref } from 'vue'
import BookCard from '../components/BookCard.vue'
import SettingsDrawer from '../components/SettingsDrawer.vue'
import { useLibraryStore } from '../store/library'
import { useUiStore } from '../store/ui'

const library = useLibraryStore()
const ui = useUiStore()

const settingsOpen = ref(false)
const importing = ref(false)

const sortedBooks = computed(() =>
  [...library.books].sort((a, b) => b.lastReadAt - a.lastReadAt)
)

async function onImport(): Promise<void> {
  importing.value = true
  try {
    const book = await library.importBook()
    if (book) ui.openBook(book.id)
  } finally {
    importing.value = false
  }
}

function openBook(id: string): void {
  ui.openBook(id)
}

async function removeBook(id: string): Promise<void> {
  await library.removeBook(id)
}
</script>

<template>
  <div class="shelf">
    <header class="shelf__top">
      <div class="shelf__brand">
        <span class="shelf__brand-dot" aria-hidden="true"></span>
        <h1 class="shelf__brand-name">阅读器</h1>
      </div>
      <div class="shelf__actions">
        <button class="ghost-btn" type="button" @click="settingsOpen = true">设置</button>
        <button class="primary-btn" type="button" :disabled="importing" @click="onImport">
          {{ importing ? '导入中…' : '导入书籍' }}
        </button>
      </div>
    </header>

    <main class="shelf__body">
      <template v-if="sortedBooks.length > 0">
        <div class="shelf__heading">
          <p class="shelf__count">共 {{ sortedBooks.length }} 本</p>
        </div>
        <div class="shelf__grid">
          <BookCard
            v-for="book in sortedBooks"
            :key="book.id"
            :book="book"
            :progress="library.progressOf(book.id)"
            @open="openBook(book.id)"
            @remove="removeBook(book.id)"
          />
        </div>
      </template>

      <div v-else class="shelf__empty">
        <p class="shelf__empty-mark">一</p>
        <h2 class="shelf__empty-title">书架还是空的</h2>
        <p class="shelf__empty-hint">导入一本 EPUB，从上次读到的地方继续。</p>
        <button class="primary-btn primary-btn--lg" type="button" :disabled="importing" @click="onImport">
          导入第一本书
        </button>
      </div>
    </main>

    <SettingsDrawer :open="settingsOpen" @close="settingsOpen = false" />
  </div>
</template>

<style scoped>
.shelf {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.shelf__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 28px;
  border-bottom: 1px solid var(--border);
}

.shelf__brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.shelf__brand-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent);
  align-self: center;
}

.shelf__brand-name {
  margin: 0;
  font-family: 'Songti SC', 'Noto Serif SC', 'Source Han Serif SC', STSong, serif;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.shelf__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.shelf__body {
  flex: 1;
  overflow-y: auto;
  padding: 26px 28px 48px;
}

.shelf__heading {
  margin-bottom: 18px;
}

.shelf__count {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.shelf__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 26px 20px;
}

.shelf__empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 20px;
}

.shelf__empty-mark {
  margin: 0 0 18px;
  font-family: 'Songti SC', 'Noto Serif SC', 'Source Han Serif SC', STSong, serif;
  font-size: 44px;
  color: var(--border);
  line-height: 1;
}

.shelf__empty-title {
  margin: 0 0 8px;
  font-family: 'Songti SC', 'Noto Serif SC', 'Source Han Serif SC', STSong, serif;
  font-size: 22px;
  font-weight: 600;
}

.shelf__empty-hint {
  margin: 0 0 24px;
  color: var(--muted);
  font-size: 14px;
}

.primary-btn,
.ghost-btn {
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.primary-btn {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  padding: 8px 16px;
  font-size: 14px;
}

.primary-btn:hover {
  background: color-mix(in srgb, var(--accent) 88%, #000);
}

.primary-btn:disabled {
  opacity: 0.55;
  cursor: default;
}

.primary-btn--lg {
  padding: 11px 24px;
  font-size: 15px;
}

.ghost-btn {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--fg);
  padding: 8px 14px;
  font-size: 14px;
}

.ghost-btn:hover {
  background: var(--surface-2);
}
</style>
