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
        <span class="shelf__brand-heart" aria-hidden="true"></span>
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
        <div class="shelf__empty-art" aria-hidden="true">
          <span class="book-shape">
            <span class="book-shape__page book-shape__page--left"></span>
            <span class="book-shape__page book-shape__page--right"></span>
          </span>
          <span class="sparkle sparkle--a"></span>
          <span class="sparkle sparkle--b"></span>
          <span class="sparkle sparkle--c"></span>
        </div>
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
  align-items: center;
  gap: 10px;
}

.shelf__brand-heart {
  position: relative;
  width: 16px;
  height: 16px;
  background: var(--accent);
  border-radius: 2px;
  transform: rotate(45deg);
}

.shelf__brand-heart::before,
.shelf__brand-heart::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: inherit;
}

.shelf__brand-heart::before {
  left: -8px;
  top: 0;
}

.shelf__brand-heart::after {
  top: -8px;
  left: 0;
}

.shelf__brand-name {
  margin: 0;
  font-family: 'Yuanti SC', 'YouYuan', '幼圆', 'PingFang SC', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
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

.shelf__empty-art {
  position: relative;
  width: 180px;
  height: 120px;
  margin-bottom: 18px;
}

.book-shape {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  width: 96px;
  height: 62px;
}

.book-shape__page {
  position: absolute;
  top: 0;
  width: 46px;
  height: 60px;
  border: 3px solid var(--accent-2);
}

.book-shape__page--left {
  left: 0;
  border-radius: 12px 4px 6px 10px;
  transform: skewY(4deg);
  background: linear-gradient(135deg, var(--surface), var(--surface-2));
}

.book-shape__page--right {
  right: 0;
  border-radius: 4px 12px 10px 6px;
  transform: skewY(-4deg);
  background: linear-gradient(-135deg, var(--surface), var(--accent-soft));
}

.sparkle {
  position: absolute;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}

.sparkle--a {
  width: 22px;
  height: 22px;
  top: 0;
  left: 22px;
  background: var(--accent-2);
}

.sparkle--b {
  width: 14px;
  height: 14px;
  top: 14px;
  right: 20px;
  background: var(--accent);
}

.sparkle--c {
  width: 11px;
  height: 11px;
  bottom: 2px;
  left: 10px;
  background: var(--accent-3);
}

.shelf__empty-title {
  margin: 0 0 8px;
  font-family: 'Yuanti SC', 'YouYuan', '幼圆', 'PingFang SC', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--accent);
}

.shelf__empty-hint {
  margin: 0 0 24px;
  color: var(--muted);
  font-size: 14px;
}

.primary-btn,
.ghost-btn {
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.primary-btn {
  border: 1px solid transparent;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: #fff;
  padding: 8px 16px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(255, 111, 169, 0.25);
}

.primary-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.05);
}

.primary-btn:active {
  transform: translateY(0);
}

.primary-btn:disabled {
  opacity: 0.55;
  cursor: default;
  transform: none;
}

.primary-btn--lg {
  padding: 11px 24px;
  font-size: 15px;
}

.ghost-btn {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--fg);
  padding: 8px 14px;
  font-size: 14px;
}

.ghost-btn:hover {
  background: var(--surface-2);
  border-color: var(--accent);
  color: var(--accent);
}
</style>