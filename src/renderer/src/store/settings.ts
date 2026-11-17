import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Settings, ThemeMode } from '@shared/types'

export const useSettingsStore = defineStore('settings', () => {
  const fontSize = ref(16)
  const theme = ref<ThemeMode>('day')

  function apply(settings: Settings): void {
    fontSize.value = settings.fontSize
    theme.value = settings.theme
    syncTheme()
  }

  function syncTheme(): void {
    document.documentElement.dataset.theme = theme.value
  }

  async function persist(): Promise<void> {
    await window.api.saveSettings({ fontSize: fontSize.value, theme: theme.value })
  }

  async function setFontSize(value: number): Promise<void> {
    fontSize.value = value
    await persist()
  }

  async function setTheme(value: ThemeMode): Promise<void> {
    theme.value = value
    syncTheme()
    await persist()
  }

  return { fontSize, theme, apply, setFontSize, setTheme }
})
