<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Book } from '@shared/types'

const props = defineProps<{
  book: Book
  progress: number
}>()

const emit = defineEmits<{
  open: []
  remove: []
}>()

const cover = ref<string | null>(null)
const confirming = ref(false)

const percentText = computed(() => `${Math.round((props.progress || 0) * 100)}%`)

onMounted(async () => {
  cover.value = await window.api.getCover(props.book.id)
})

function onRemoveClick(): void {
  if (confirming.value) {
    emit('remove')
    confirming.value = false
  } else {
    confirming.value = true
  }
}
</script>

<template>
  <article class="book-card" @click="emit('open')">
    <div class="book-card__cover">
      <img v-if="cover" :src="cover" :alt="book.title" />
      <span v-else class="book-card__placeholder">{{ book.title.slice(0, 1) }}</span>
      <button
        class="book-card__remove"
        type="button"
        :class="{ 'is-confirming': confirming }"
        :title="confirming ? '确认移除' : '从书架移除'"
        @click.stop="onRemoveClick"
      >
        {{ confirming ? '确认移除' : '移除' }}
      </button>
    </div>

    <h3 class="book-card__title" :title="book.title">{{ book.title }}</h3>
    <p class="book-card__author">{{ book.author }}</p>

    <div class="book-card__progress">
      <div class="book-card__track">
        <div class="book-card__fill" :style="{ width: percentText }"></div>
      </div>
      <span class="book-card__percent">{{ percentText }}</span>
    </div>
  </article>
</template>

<style scoped>
.book-card {
  cursor: pointer;
  min-width: 0;
  transition: transform 0.18s ease;
}

.book-card:hover {
  transform: translateY(-4px);
}

.book-card__cover {
  position: relative;
  aspect-ratio: 2 / 3;
  background: var(--surface-2);
  border-radius: 8px;
  border: 2px solid var(--border);
  box-shadow: var(--shadow);
  overflow: hidden;
  display: grid;
  place-items: center;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.book-card:hover .book-card__cover {
  border-color: var(--accent-2);
  box-shadow: 0 6px 18px rgba(85, 184, 255, 0.22), 0 16px 34px rgba(255, 111, 169, 0.18);
}

.book-card__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-card__placeholder {
  font-family: 'Yuanti SC', 'YouYuan', '幼圆', 'PingFang SC', sans-serif;
  font-size: 36px;
  color: var(--accent);
  background: linear-gradient(135deg, #ffffff, var(--surface-2));
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.book-card__remove {
  position: absolute;
  top: 8px;
  right: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  font-size: 12px;
  padding: 4px 9px;
  border-radius: 999px;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.book-card:hover .book-card__remove,
.book-card__remove:focus-visible {
  opacity: 1;
}

.book-card__remove.is-confirming {
  opacity: 1;
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.book-card__title {
  margin: 12px 0 2px;
  font-family: 'Yuanti SC', 'YouYuan', '幼圆', 'PingFang SC', sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-card__author {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-card__progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.book-card__track {
  flex: 1;
  height: 6px;
  background: var(--surface-2);
  border-radius: 999px;
  overflow: hidden;
}

.book-card__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
}

.book-card__percent {
  font-size: 11px;
  color: var(--muted);
  min-width: 32px;
  text-align: right;
}
</style>