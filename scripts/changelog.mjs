import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date())
const head = (() => { try { return git('show', 'HEAD:CHANGELOG.md') } catch { return '' } })()
const sections = text => new Map([...text.matchAll(/^## (\d{4}-\d{2}-\d{2})\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].map(m => [m[1], m[2]]))
const bullets = text => text.split('\n').filter(line => line.startsWith('- '))
const mode = process.argv[2]
if (mode === 'prepare') {
  for (const args of [['status', '--short'], ['diff', '--stat', 'HEAD'], ['diff', 'HEAD', '--', '.', ':!CHANGELOG.md', ':!package-lock.json']]) process.stdout.write(git(...args))
  console.log('\n未跟踪文件需逐一阅读：\n' + git('ls-files', '--others', '--exclude-standard'))
  console.log(`\n${today} 已有记录：\n` + (existsSync('CHANGELOG.md') ? sections(readFileSync('CHANGELOG.md', 'utf8')).get(today) || '无' : '无'))
  console.log('请根据上述实际差异整理中文更新条目，合并当日记录，并与修改一起暂存。')
} else if (mode === 'check') {
  const fail = message => { console.error('更新日志校验失败：' + message); process.exit(1) }
  const staged = git('diff', '--cached', '--name-only', '--diff-filter=ACDMRT') .trim().split('\n').filter(Boolean)
  if (!staged.length) process.exit(0)
  if (!staged.includes('CHANGELOG.md')) fail('请先更新 CHANGELOG.md，并与本次修改一起暂存。')
  let next
  try { next = git('show', ':CHANGELOG.md') } catch { fail('不得删除 CHANGELOG.md。') }
  const dates = [...next.matchAll(/^## (\d{4}-\d{2}-\d{2})$/gm)].map(m => m[1])
  if (new Set(dates).size !== dates.length || dates.join() !== [...dates].sort().reverse().join()) fail('日期必须倒序，且同日只能一个标题。')
  const oldSections = sections(head), nextSections = sections(next)
  const current = nextSections.get(today)
  if (!current || !bullets(current).length) fail(`缺少 ${today} 的实际更新记录。`)
  const allowed = ['【新增功能】', '【交互优化】', '【视觉调整】', '【问题修复】']
  for (const [date, body] of nextSections) {
    if (date !== today && oldSections.has(date)) continue
    const groups = [...body.matchAll(/^### (.+)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)]
    if (!groups.length || groups.some(m => !allowed.includes(m[1]) || !bullets(m[2]).length)) fail('仅允许四类中文标题，且不得保留空分类。')
    if (new Set(groups.map(m => m[1])).size !== groups.length) fail('同日分类不得重复。')
    if (new Set(bullets(body)).size !== bullets(body).length) fail('同日存在重复条目。')
  }
  for (const [date, body] of oldSections) {
    if (date !== today && nextSections.get(date) !== body) fail(`不得覆盖 ${date} 的历史记录。`)
    if (date === today && bullets(body).some(line => !bullets(current).includes(line))) fail('不得删除或覆盖当日旧条目；请追加不重复内容。')
  }
  if (current === oldSections.get(today)) fail('当日记录未更新，请补充本次实际变化。')
  console.log('更新日志校验通过。')
} else if (mode === 'message') {
  const path = process.argv[3]
  if (!path) throw new Error('缺少提交信息文件路径')
  if (readFileSync(path, 'utf8').split('\n').some(line => line.trim() && !line.startsWith('#'))) process.exit(0)
  const next = git('show', ':CHANGELOG.md')
  const previous = new Set(bullets(sections(head).get(today) || ''))
  const added = bullets(sections(next).get(today) || '').filter(line => !previous.has(line))
  const first = added[0]?.replace(/^- /, '').replace(/[。；].*$/, '')
  if (!first) throw new Error('没有可生成提交信息的新日志')
  writeFileSync(path, `更新${first.slice(0, 46)}${first.length > 46 ? '…' : ''}\n`)
} else {
  throw new Error('用法：node scripts/changelog.mjs prepare|check|message')
}
