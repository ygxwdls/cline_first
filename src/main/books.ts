import { app, dialog, type BrowserWindow } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import AdmZip from 'adm-zip'
import type { Book } from '@shared/types'
import { findOpfPath, parseMetadata } from './epub-parse'

export async function chooseEpub(win: BrowserWindow): Promise<string | null> {
  const result = await dialog.showOpenDialog(win, {
    title: '导入 EPUB 书籍',
    properties: ['openFile'],
    filters: [{ name: 'EPUB 电子书', extensions: ['epub'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
}

export async function importEpub(filePath: string, fallbackTitle?: string): Promise<Book> {
  await validateEpub(filePath)

  const id = crypto.randomUUID()
  const booksDir = path.join(app.getPath('userData'), 'books')
  const coversDir = path.join(app.getPath('userData'), 'covers')
  await fs.mkdir(booksDir, { recursive: true })
  await fs.mkdir(coversDir, { recursive: true })

  const targetEpubPath = path.join(booksDir, `${id}.epub`)
  await fs.copyFile(filePath, targetEpubPath)

  const zip = new AdmZip(targetEpubPath)
  const opfPath = findOpfPath(zip)
  const fileName = path.basename(filePath)
  const fallback = fallbackTitle ?? fileName.replace(/\.epub$/i, '')
  const meta = opfPath
    ? parseMetadata(zip, opfPath, fallback)
    : { title: fallback, author: '未知作者', coverEntryName: null }

  let coverPath: string | null = null
  if (meta.coverEntryName) {
    const coverEntry = zip.getEntry(meta.coverEntryName)
    if (coverEntry && coverEntry.header.size > 0) {
      const ext = (path.extname(meta.coverEntryName) || '.jpg').toLowerCase()
      coverPath = path.join(coversDir, `${id}${ext}`)
      await fs.writeFile(coverPath, coverEntry.getData())
    }
  }

  const now = Date.now()
  return {
    id,
    title: meta.title,
    author: meta.author,
    coverPath,
    fileName,
    importedAt: now,
    lastReadAt: now
  }
}

async function validateEpub(filePath: string): Promise<void> {
  const ext = path.extname(filePath).toLowerCase()
  if (ext !== '.epub') {
    throw new Error('只支持 .epub 格式的书籍')
  }
  const stat = await fs.stat(filePath)
  if (!stat.isFile()) {
    throw new Error('所选路径不是有效文件')
  }
  // 校验 zip 结构完整，避免导入损坏文件。
  try {
    const zip = new AdmZip(filePath)
    if (!zip.getEntry('mimetype')) {
      throw new Error('缺少 mimetype 条目')
    }
  } catch {
    throw new Error('不是有效的 EPUB 文件')
  }
}

export async function readEpubFile(bookId: string): Promise<ArrayBuffer> {
  const booksDir = path.join(app.getPath('userData'), 'books')
  const buffer = await fs.readFile(path.join(booksDir, `${bookId}.epub`))
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
}

export async function readCoverAsDataUrl(book: Book): Promise<string | null> {
  if (!book.coverPath) return null
  try {
    const buffer = await fs.readFile(book.coverPath)
    const mime = mimeFromExt(path.extname(book.coverPath))
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}

function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.svg':
      return 'image/svg+xml'
    default:
      return 'image/jpeg'
  }
}
