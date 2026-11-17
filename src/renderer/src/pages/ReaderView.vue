<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Bookmark } from '@shared/types'
import BookmarkDrawer from '../components/BookmarkDrawer.vue'
import SettingsDrawer from '../components/SettingsDrawer.vue'
import TocDrawer from '../components/TocDrawer.vue'
import { EpubReader, type NavItem } from '../reader/epub'
import { useLibraryStore } from '../store/library'
import { useSettingsStore } from '../store/settings'
import { useUiStore } from '../store/ui'

const props = defineProps<{
  bookId: string
}>()

const library = useLibraryStore()
const settings = useSettingsStore()
const ui = useUiStore()

const book = computed(() => library.books.find((item) => item.id === props.bookId))
const bookmarks = computed(() => library.bookmarks[props.bookId] ?? [])

const viewerEl = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref('')

const toc = ref<NavItem[]>([])
const tocOpen = ref(false)
const bookmarkOpen = ref(false)
const settingsOpen = ref(false)

const percent = ref(0)
const statsSeconds = ref(0)

let reader: EpubReader | null = null
let lastLocation: { cfi: string; percent: number } | null = null

let saveTimer: number | undefined
let heartbeat: number | undefined
let flusher: number | undefined

let totalSeconds = 0
let lastActiveAt = Date.now()
let lastFlushAt = Date.now()

let unsubscribeFlush: (() => void) | null = null

const percentText = computed(() => `${Math.round(percent.value * 100)}%`)
const durationText = computed(() => `已读 ${formatDuration(statsSeconds.value)}`)

watch(
  () => settings.fontSize,
  (value) => reader?.setFontSize(value)
)

watch(
  () => settings.theme,
  (value) => reader?.setTheme(value)
)

onMounted(async () => {
  totalSeconds = library.stats[props.bookId]?.totalSeconds ?? 0
  statsSeconds.value = Math.round(totalSeconds)

  if (!book.value) {
    error.value = '找不到这本书'
    loading.value = false
    return
  }

  try {
    const buffer = await window.api.readBook(props.bookId)
    reader = new EpubReader(buffer)
    await reader.ready()

    if (viewerEl.value) {
      reader.renderTo(viewerEl.value)
      reader.setTheme(settings.theme)
      reader.setFontSize(settings.fontSize)
    }

    reader.on('relocated', onRelocated)
    toc.value = await reader.toc()

    const saved = library.progress[props.bookId]
    if (saved?.cfi) {
      await reader.display(saved.cfi)
    } else {
      await reader.display()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '打开这本书时出错了'
  } finally {
    loading.value = false
  }

  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pointerdown', markActive)
  window.addEventListener('visibilitychange', onVisibility)
  unsubscribeFlush = window.api.onFlushRequest(onFlushRequest)
  startTimers()
})

onBeforeUnmount(() => {
  if (saveTimer) clearTimeout(saveTimer)
  if (heartbeat) clearInterval(heartbeat)
  if (flusher) clearInterval(flusher)

  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pointerdown', markActive)
  window.removeEventListener('visibilitychange', onVisibility)
  unsubscribeFlush?.()

  void flushProgress()
  void flushStats()
  reader?.destroy()
  reader = null
})

function onRelocated(location: unknown): void {
  const start = (location as { start?: { percentage?: number; cfi?: string } })?.start
  if (!start) return
  const nextPercent = typeof start.percentage === 'number' ? start.percentage : 0
  const cfi = typeof start.cfi === 'string' ? start.cfi : ''
  percent.value = nextPercent
  lastLocation = { cfi, percent: nextPercent }
  scheduleProgressSave()
}

function scheduleProgressSave(): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    saveTimer = undefined
    void flushProgress()
  }, 350)
}

async function flushProgress(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = undefined
  }
  if (!lastLocation) return
  await library.saveProgress(props.bookId, {
    cfi: lastLocation.cfi,
    percent: lastLocation.percent,
    updatedAt: Date.now()
  })
}

async function flushStats(): Promise<void> {
  await library.saveStats(props.bookId, {
    totalSeconds: Math.round(totalSeconds),
    lastReadAt: Date.now()
  })
}

function onFlushRequest(): void {
  void (async () => {
    await flushProgress()
    await flushStats()
    window.api.notifyFlushed()
  })()
}

async function nextPage(): Promise<void> {
  await reader?.next()
}

async function prevPage(): Promise<void> {
  await reader?.prev()
}

function onKeydown(event: KeyboardEvent): void {
  markActive()
  if (event.key === 'ArrowRight') {
    void nextPage()
  } else if (event.key === 'ArrowLeft') {
    void prevPage()
  } else if (event.key === 'Escape') {
    closeDrawers()
  }
}

function onVisibility(): void {
  if (document.visibilityState === 'hidden') {
    void flushProgress()
    void flushStats()
  } else {
    lastActiveAt = Date.now()
    lastFlushAt = Date.now()
  }
}

function markActive(): void {
  lastActiveAt = Date.now()
}

function isActive(): boolean {
  return (
    document.hasFocus() &&
    document.visibilityState === 'visible' &&
    Date.now() - lastActiveAt < 90_000
  )
}

function startTimers(): void {
  lastActiveAt = Date.now()
  lastFlushAt = Date.now()

  heartbeat = window.setInterval(() => {
    const now = Date.now()
    if (isActive()) {
      totalSeconds += (now - lastFlushAt) / 1000
    }
    lastFlushAt = now
    statsSeconds.value = Math.round(totalSeconds)
  }, 1000)

  flusher = window.setInterval(() => {
    void flushStats()
  }, 10_000)
}

function addBookmark(): void {
  if (!lastLocation) return
  const bookmark: Bookmark = {
    id: crypto.randomUUID(),
    cfi: lastLocation.cfi,
    percent: lastLocation.percent,
    note: '',
    createdAt: Date.now()
  }
  void library.saveBookmarks(props.bookId, [bookmark, ...bookmarks.value])
}

function removeBookmark(id: string): void {
  void library.saveBookmarks(
    props.bookId,
    bookmarks.value.filter((item) => item.id !== id)
  )
}

async function jumpTo(target: string): Promise<void> {
  await reader?.display(target)
  tocOpen.value = false
  bookmarkOpen.value = false
}

function closeDrawers(): void {
  tocOpen.value = false
  bookmarkOpen.value = false
  settingsOpen.value = false
}

function back(): void {
  ui.goBookshelf()
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  return `${hours} 小时 ${minutes % 60} 分`
}
</script>

<template>
  <div class="reader">
    <header class="reader__bar">
      <button class="reader__back" type="button" @click="back">书架</button>
      <div class="reader__title" :title="book?.title">{{ book?.title ?? '阅读中' }}</div>
      <div class="reader__tools">
        <button type="button" @click="tocOpen = true">目录</button>
        <button type="button" @click="bookmarkOpen = true">书签</button>
        <button type="button" @click="settingsOpen = true">设置</button>
      </div>
    </header>

    <div v-if="error" class="reader__state">
      <p>{{ error }}</p>
      <button class="reader__state-btn" type="button" @click="back">返回书架</button>
    </div>

    <div v-else class="reader__stage">
      <div ref="viewerEl" class="reader__viewer"></div>
      <button class="tap tap--left" type="button" aria-label="上一页" @click="prevPage"></button>
      <button class="tap tap--right" type="button" aria-label="下一页" @click="nextPage"></button>
      <div v-if="loading" class="reader__loading">正在打开…</div>
    </div>

    <footer class="reader__status">
      <span class="reader__percent">{{ percentText }}</span>
      <div class="reader__track">
        <div class="reader__fill" :style="{ width: percentText }"></div>
      </div>
      <span class="reader__time">{{ durationText }}</span>
    </footer>

    <TocDrawer :open="tocOpen" :items="toc" @close="tocOpen = false" @jump="jumpTo" />
    <BookmarkDrawer
      :open="bookmarkOpen"
      :bookmarks="bookmarks"
      @close="bookmarkOpen = false"
      @add="addBookmark"
      @remove="removeBookmark"
      @jump="jumpTo"
    />
    <SettingsDrawer :open="settingsOpen" @close="settingsOpen = false" />
  </div>
</template>

<style scoped>
.reader {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--paper);
}

.reader__bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.reader__back {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 6px;
}

.reader__back:hover {
  color: var(--fg);
}

.reader__title {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-family: 'Songti SC', 'Noto Serif SC', 'Source Han Serif SC', STSong, serif;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reader__tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reader__tools button {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 14px;
  padding: 6px 10px;
  border-radius: 5px;
  cursor: pointer;
}

.reader__tools button:hover {
  color: var(--fg);
  background: var(--surface-2);
}

.reader__stage {
  position: relative;
  flex: 1;
  min-height: 0;
}

.reader__viewer {
  position: absolute;
  inset: 0;
}

.reader__viewer :deep(iframe) {
  border: 0;
  display: block;
}

.tap {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 22%;
  border: 0;
  background: transparent;
  cursor: pointer;
  z-index: 5;
}

.tap--left {
  left: 0;
}

.tap--right {
  right: 0;
}

.reader__loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--muted);
  font-size: 14px;
  background: var(--paper);
}

.reader__state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  color: var(--muted);
  font-size: 15px;
}

.reader__state-btn {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--fg);
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.reader__status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 20px 11px;
  border-top: 1px solid var(--border);
  background: var(--surface);
}

.reader__percent,
.reader__time {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.reader__track {
  flex: 1;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.reader__fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.2s ease;
}
</style>
