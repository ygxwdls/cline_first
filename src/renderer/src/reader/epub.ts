import ePub from 'epubjs'
import type { Book, NavItem, Rendition } from 'epubjs'

export type { NavItem }

type ThemeRules = Record<string, Record<string, string>>

const THEMES: Record<'day' | 'night', ThemeRules> = {
  day: {
    body: { background: '#fafcfa', color: '#20261f', 'line-height': '1.75' },
    a: { color: '#1f6a49 !important' },
    'a:visited': { color: '#1f6a49 !important' },
    'a:hover': { color: '#17583c !important' },
    'a:active': { color: '#17583c !important' }
  },
  night: {
    body: { background: '#141915', color: '#c9d2ca', 'line-height': '1.75' },
    a: { color: '#6fd29a !important' },
    'a:visited': { color: '#6fd29a !important' },
    'a:hover': { color: '#8fe0b0 !important' },
    'a:active': { color: '#8fe0b0 !important' }
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