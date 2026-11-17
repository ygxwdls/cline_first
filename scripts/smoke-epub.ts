import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import AdmZip from 'adm-zip'
import { findOpfPath, parseMetadata } from '../src/main/epub-parse.ts'

const CONTAINER = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`

const OPF = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>测试之书</dc:title>
    <dc:creator>某位作者</dc:creator>
    <dc:identifier id="bookid">urn:uuid:1234</dc:identifier>
    <dc:language>zh</dc:language>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="c1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="cover" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>
  </manifest>
  <spine>
    <itemref idref="c1"/>
  </spine>
</package>`

const CHAPTER = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>第一章</title></head>
<body><h1>第一章</h1><p>正文内容。</p></body></html>`

// 1x1 的极简 JPEG 字节，仅用于路径检测，不要求可解码。
const FAKE_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9
])

const dir = await mkdtemp(path.join(os.tmpdir(), 'reader-smoke-'))
const epubPath = path.join(dir, 'sample.epub')

try {
  const zip = new AdmZip()
  zip.addFile('mimetype', Buffer.from('application/epub+zip'))
  zip.addFile('META-INF/container.xml', Buffer.from(CONTAINER, 'utf-8'))
  zip.addFile('OEBPS/content.opf', Buffer.from(OPF, 'utf-8'))
  zip.addFile('OEBPS/chapter1.xhtml', Buffer.from(CHAPTER, 'utf-8'))
  zip.addFile('OEBPS/images/cover.jpg', FAKE_JPEG)
  await writeFile(epubPath, zip.toBuffer())

  const reopened = new AdmZip(epubPath)
  const opfPath = findOpfPath(reopened)
  if (opfPath !== 'OEBPS/content.opf') {
    throw new Error(`OPF 路径解析错误: ${opfPath}`)
  }

  const meta = parseMetadata(reopened, opfPath, '回退标题')
  if (meta.title !== '测试之书') throw new Error(`标题解析错误: ${meta.title}`)
  if (meta.author !== '某位作者') throw new Error(`作者解析错误: ${meta.author}`)
  if (meta.coverEntryName !== 'OEBPS/images/cover.jpg') {
    throw new Error(`封面路径解析错误: ${meta.coverEntryName}`)
  }

  console.log('smoke-epub: ok')
  console.log(`  title=${meta.title} author=${meta.author} cover=${meta.coverEntryName}`)
} finally {
  await rm(dir, { recursive: true, force: true })
}
