import path from 'node:path'
import { writeFile } from 'node:fs/promises'
import { formatPostText } from './exportText.js'

export async function writePostTextFile(postDir, content, meta = {}) {
  const title =
    meta.image?.subject_line ||
    meta.subject?.card ||
    meta.template ||
    meta.id ||
    ''
  const text = formatPostText(content, { postId: meta.id, title })
  const out = path.join(postDir, 'post.txt')
  await writeFile(out, text, 'utf8')
  return out
}
