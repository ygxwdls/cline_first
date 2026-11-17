<script setup lang="ts">
import { onMounted } from 'vue'
import BookshelfView from './pages/BookshelfView.vue'
import ReaderView from './pages/ReaderView.vue'
import { useLibraryStore } from './store/library'
import { useSettingsStore } from './store/settings'
import { useUiStore } from './store/ui'

const library = useLibraryStore()
const settings = useSettingsStore()
const ui = useUiStore()

onMounted(async () => {
  const data = await library.init()
  settings.apply(data.settings)
})
</script>

<template>
  <BookshelfView v-if="ui.route.name === 'bookshelf'" />
  <ReaderView
    v-else-if="ui.route.name === 'reader'"
    :key="ui.route.bookId"
    :book-id="ui.route.bookId"
  />
</template>
