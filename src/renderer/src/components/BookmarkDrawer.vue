<script setup lang="ts">
import type { Bookmark } from '@shared/types'

defineProps<{
  open: boolean
  bookmarks: Bookmark[]
}>()

const emit = defineEmits<{
  close: []
  add: []
  remove: [id: string]
  jump: [cfi: string]
}>()

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="overlay" @click.self="emit('close')">
        <aside class="panel panel--right">
          <header class="panel__head">
            <h2 class="panel__title">书签</h2>
            <button class="add-btn" type="button" @click="emit('add')">添加当前页</button>
          </header>
          <div v-if="bookmarks.length" class="panel__scroll">
            <div v-for="bookmark in bookmarks" :key="bookmark.id" class="bookmark">
              <button class="bookmark__main" type="button" @click="emit('jump', bookmark.cfi)">
                <span class="bookmark__percent">{{ Math.round(bookmark.percent * 100) }}%</span>
                <span class="bookmark__time">{{ formatTime(bookmark.createdAt) }}</span>
              </button>
              <button
                class="bookmark__remove"
                type="button"
                aria-label="删除书签"
                @click="emit('remove', bookmark.id)"
              >
                ×
              </button>
            </div>
          </div>
          <p v-else class="panel__empty">还没有书签，读到一半时留个记号吧。</p>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 25, 17, 0.32);
  z-index: 50;
}

.panel {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 320px;
  background: var(--surface);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
}

.panel--right {
  right: 0;
}

.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.panel__title {
  margin: 0;
  font-family: 'Songti SC', 'Noto Serif SC', 'Source Han Serif SC', STSong, serif;
  font-size: 17px;
  font-weight: 600;
}

.add-btn {
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent);
  font-size: 13px;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
}

.add-btn:hover {
  background: var(--accent-soft);
}

.panel__scroll {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0 20px;
}

.bookmark {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border);
}

.bookmark__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  border: 0;
  background: transparent;
  color: var(--fg);
  padding: 12px 16px;
  cursor: pointer;
}

.bookmark__main:hover {
  background: var(--surface-2);
}

.bookmark__percent {
  font-size: 14px;
  font-weight: 600;
}

.bookmark__time {
  font-size: 12px;
  color: var(--muted);
}

.bookmark__remove {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 20px;
  cursor: pointer;
  padding: 8px 14px;
}

.bookmark__remove:hover {
  color: var(--accent);
}

.panel__empty {
  padding: 24px 20px;
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>