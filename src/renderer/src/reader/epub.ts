import ePub from 'epubjs'
import type { Book, NavItem, Rendition } from 'epubjs'

export type { NavItem }

type ThemeRules = Record<string, Record<string, string>>

const THEMES: Record<'day' | 'night', ThemeRules> = {
  day: {
    body: { background: '#fffaf4', color: '#44303d', 'line-height': '1.75' },
    a: { color: '#e84c95 !important' },
    'a:visited': { color: '#e84c95 !important' },
    'a:hover': { color: '#c93a7d !important' },
    'a:active': { color: '#c93a7d !important' }
  },
  night: {
    body: { background: '#292235', color: '#d9cfe2', 'line-height': '1.75' },
    a: { color: '#ff8fc1 !important' },
    'a:visited': { color: '#ff8fc1 !important' },
    'a:hover': { color: '#ffabd4 !important' },
    'a:active': { color: '#ffabd4 !important' }
  }
}

/** epub.js 的薄封装：把渲染层做成可替换接口，以后要切 Readium 只动这里。 */
export class EpubReader {
  private book: Book
  private rendition: Rendition | null = null

  constructor(input: string | ArrayBuffer) {
    this.book = ePub(input)
  }

  async ready(): Promise<Book> {
    await this.book.ready
    return this.book
  }

  renderTo(element: HTMLElement): Rendition {
    this.rendition = this.book.renderTo(element, {
      width: '100%',
      height: '100%',
      spread: 'none',
      flow: 'paginated'
    })
    return this.rendition
  }

  async display(target?: string): Promise<void> {
    if (this.rendition) await this.rendition.display(target)
  }

  async next(): Promise<void> {
    await this.rendition?.next()
  }

  async prev(): Promise<void> {
    await this.rendition?.prev()
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    this.rendition?.on(event, listener)
  }

  setFontSize(px: number): void {
    this.rendition?.themes.fontSize(`${px}px`)
  }

  setTheme(theme: 'day' | 'night'): void {
    if (!this.rendition) return
    const themes = this.rendition.themes
    themes.register('day', THEMES.day)
    themes.register('night', THEMES.night)
    themes.select(theme)
  }

  async toc(): Promise<NavItem[]> {
    await this.book.loaded.navigation
    return this.book.navigation?.toc ?? []
  }

  destroy(): void {
    this.rendition?.destroy()
    this.book.destroy()
    this.rendition = null
  }
}