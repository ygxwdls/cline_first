<script setup lang="ts">
import { computed } from 'vue'
import type { NavItem } from '../reader/epub'

const props = defineProps<{
  open: boolean
  items: NavItem[]
}>()

const emit = defineEmits<{
  close: []
  jump: [href: string]
}>()

interface FlatTocItem {
  href: string
  label: string
  depth: number
}

const flatItems = computed<FlatTocItem[]>(() => {
  const result: FlatTocItem[] = []
  const walk = (items: NavItem[], depth: number): void => {
    for (const item of items) {
      if (item.href) result.push({ href: item.href, label: item.label, depth })
      if (item.subitems?.length) walk(item.subitems, depth + 1)
    }
  }
  walk(props.items, 0)
  return result
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="overlay" @click.self="emit('close')">
        <aside class="panel panel--left">
          <header class="panel__head">
            <h2 class="panel__title">目录</h2>
            <button class="panel__close" type="button" aria-label="关闭" @click="emit('close')">×</button>
          </header>
          <div v-if="flatItems.length" class="panel__scroll">
            <button
              v-for="(item, index) in flatItems"
              :key="`${item.href}-${index}`"
              class="toc-item"
              type="button"
              :style="{ paddingLeft: `${14 + item.depth * 16}px` }"
              @click="emit('jump', item.href)"
            >
              {{ item.label }}
            </button>
          </div>
          <p v-else class="panel__empty">这本书没有目录信息</p>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(48, 28, 40, 0.34);
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

.panel--left {
  left: 0;
  border-radius: 0 20px 20px 0;
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
  font-family: 'Yuanti SC', 'YouYuan', '幼圆', 'PingFang SC', sans-serif;
  font-size: 17px;
  font-weight: 600;
  color: var(--accent);
}

.panel__close {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
  border-radius: 50%;
}

.panel__close:hover {
  color: var(--accent);
  background: var(--surface-2);
}

.panel__scroll {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0 20px;
}

.toc-item {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  color: var(--fg);
  font-size: 14px;
  line-height: 1.4;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.toc-item:hover {
  background: var(--surface-2);
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