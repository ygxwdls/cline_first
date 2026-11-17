import path from 'node:path'
import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'

export interface ParsedMetadata {
  title: string
  author: string
  coverEntryName: string | null
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name: string) => name === 'item' || name === 'meta'
})

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function asText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (typeof obj['#text'] === 'string') return obj['#text']
    for (const key of Object.keys(obj)) {
      if (key !== '@_') {
        const nested = asText(obj[key])
        if (nested) return nested
      }
    }
  }
  return ''
}

function firstByKey(obj: Record<string, unknown>, candidates: string[]): unknown {
  for (const key of candidates) {
    if (obj[key] != null) return obj[key]
  }
  return undefined
}

/** 读取 container.xml 得到 OPF 文件在包内的路径。 */
export function findOpfPath(zip: AdmZip): string | null {
  const containerEntry = zip.getEntry('META-INF/container.xml')
  if (!containerEntry) return null
  const parsed = parser.parse(containerEntry.getData().toString('utf-8'))
  const rootfiles = toArray(
    parsed?.container?.rootfiles?.rootfile ?? parsed?.rootfile
  )
  for (const rootfile of rootfiles) {
    const fullPath = rootfile?.['@_full-path']
    if (typeof fullPath === 'string' && fullPath) return fullPath
  }
  return null
}

function resolveInPackage(baseDir: string, href: string): string {
  const decoded = decodeURIComponent(href)
  const joined = path.posix.join(baseDir, decoded)
  return path.posix.normalize(joined)
}

export function parseMetadata(
  zip: AdmZip,
  opfPath: string,
  fallbackTitle: string
): ParsedMetadata {
  const entry = zip.getEntry(opfPath)
  if (!entry) {
    return { title: fallbackTitle, author: '未知作者', coverEntryName: null }
  }

  const opf = parser.parse(entry.getData().toString('utf-8'))
  const pkg = opf?.package ?? opf
  const metadata = (pkg?.metadata ?? {}) as Record<string, unknown>
  const manifest = (pkg?.manifest ?? {}) as Record<string, unknown>
  const items = toArray<Record<string, unknown>>(
    (manifest?.item as Record<string, unknown>[]) ?? []
  )

  const title =
    asText(firstByKey(metadata, ['dc:title', 'dcterms:title', 'title'])) ||
    fallbackTitle
  const author =
    asText(firstByKey(metadata, ['dc:creator', 'dcterms:creator', 'creator'])) ||
    '未知作者'

  // 封面：优先 EPUB3 的 cover-image 属性，其次 EPUB2 的 <meta name="cover">。
  let coverId: string | null = null
  for (const meta of toArray<Record<string, unknown>>(
    metadata?.meta as unknown as Record<string, unknown>[]
  )) {
    if (String(meta?.['@_name'] ?? '').toLowerCase() === 'cover') {
      coverId = String(meta?.['@_content'] ?? '')
    }
  }

  let coverEntryName: string | null = null
  const opfDir = path.posix.dirname(opfPath)
  for (const item of items) {
    const props = String(item?.['@_properties'] ?? '').toLowerCase()
    const mediaType = String(item?.['@_media-type'] ?? '')
    const id = String(item?.['@_id'] ?? '')
    const href = item?.['@_href']
    if (typeof href !== 'string') continue
    const isCoverImage = props.includes('cover-image')
    const isCoverById = coverId != null && id === coverId
    if (isCoverImage || isCoverById) {
      coverEntryName = resolveInPackage(opfDir, href)
      break
    }
    if (!coverEntryName && mediaType.startsWith('image/') && /cover/i.test(`${id} ${href}`)) {
      coverEntryName = resolveInPackage(opfDir, href)
    }
  }

  return { title, author, coverEntryName }
}
