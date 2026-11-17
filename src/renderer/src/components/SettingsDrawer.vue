<script setup lang="ts">
import { useSettingsStore } from '../store/settings'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const settings = useSettingsStore()

function decreaseFont(): void {
  void settings.setFontSize(Math.max(12, settings.fontSize - 1))
}

function increaseFont(): void {
  void settings.setFontSize(Math.min(28, settings.fontSize + 1))
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="overlay" @click.self="emit('close')">
        <aside class="panel">
          <header class="panel__head">
            <h2 class="panel__title">设置</h2>
            <button class="panel__close" type="button" aria-label="关闭" @click="emit('close')">×</button>
          </header>

          <div class="panel__body">
            <section class="setting">
              <div class="setting__label">
                <span class="setting__name">字号</span>
                <span class="setting__value">{{ settings.fontSize }}</span>
              </div>
              <div class="font-controls">
                <button class="step-btn" type="button" aria-label="减小字号" @click="decreaseFont">A−</button>
                <button class="step-btn step-btn--plus" type="button" aria-label="增大字号" @click="increaseFont">A+</button>
              </div>
            </section>

            <section class="setting">
              <span class="setting__name">主题</span>
              <div class="theme-options">
                <button
                  class="theme-btn"
                  :class="{ 'is-active': settings.theme === 'day' }"
                  type="button"
                  @click="settings.setTheme('day')"
                >
                  日间
                </button>
                <button
                  class="theme-btn"
                  :class="{ 'is-active': settings.theme === 'night' }"
                  type="button"
                  @click="settings.setTheme('night')"
                >
                  夜间
                </button>
              </div>
            </section>
          </div>
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
  right: 0;
  bottom: 0;
  width: 320px;
  background: var(--surface);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
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

.panel__close {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
}

.panel__body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.setting__label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.setting__name {
  font-size: 14px;
}

.setting__value {
  font-size: 13px;
  color: var(--muted);
}

.font-controls,
.theme-options {
  display: flex;
  gap: 8px;
}

.step-btn {
  flex: 1;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--fg);
  padding: 9px 0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.step-btn:hover {
  background: var(--surface-2);
}

.step-btn--plus {
  font-size: 16px;
}

.theme-btn {
  flex: 1;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--fg);
  padding: 9px 0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.theme-btn.is-active {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
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