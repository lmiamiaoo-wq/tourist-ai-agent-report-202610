import { emptyTransferBooking, parseTransferReply, transferIssues, transferInputDraft, localDay } from './transferConversation.js'

export const isDailyCharter = product => product?.id === 'daily-charter'
export const emptyCharterBooking = () => ({ ...emptyTransferBooking(), endDate: '' })
const labels = { date: '开始日期', endDate: '结束日期', time: '接驾时间', origin: '出发地', destination: '想去的地方', passengers: '人数', contact: '联系人', phone: '手机号' }
export function charterIssues(booking, now) {
  const issues = transferIssues(booking, now)
  const date = new Date(`${booking.endDate}T12:00:00`)
  if (!booking.endDate || !Number.isFinite(date.getTime()) || localDay(date) !== booking.endDate || booking.endDate < booking.date) issues.splice(issues[0]?.field === 'date' ? 1 : 0, 0, { field: 'endDate', text: '请提供不早于开始日期的有效结束日期。' })
  return issues
}
export const charterAmount = booking => (Math.round((new Date(`${booking.endDate}T12:00:00`) - new Date(`${booking.date}T12:00:00`)) / 86400000) + 1) * 900
export function charterPrompt(booking, now) {
  const issues = charterIssues(booking, now)
  const invalid = issues.find(issue => booking[issue.field])
  return `${invalid ? invalid.text : ''}您把${issues.map(issue => labels[issue.field]).join('、')}一起发我，我帮您安排这次包车。`
}
export function charterReply(text, booking, expected, now = new Date()) {
  if (/费用|多少钱|价格|怎么收费/.test(text)) return { booking, text: `按天包车900元一天，半天起订，过路费和停车费另算。${charterPrompt(booking, now)}` }
  const updated = parseTransferReply(text.replace(/想去的地方|游玩路线|行程路线/g, '目的地'), booking, expected, now)
  const dates = [...text.matchAll(/(?:(\d{4})[-/年])?(\d{1,2})[-/月](\d{1,2})(?:日|号)?/g)]
  const iso = match => `${match[1] || now.getFullYear()}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  if (dates.length > 1) updated.endDate = iso(dates[1])
  else if (dates.length === 1 && (expected === 'endDate' || /结束日期/.test(text))) { updated.date = booking.date; updated.endDate = iso(dates[0]) }
  const duration = text.match(/(?:包车|玩|用车)\s*(\d+)\s*天/)
  if (duration && updated.date && Number(duration[1]) > 0) { const end = new Date(`${updated.date}T12:00:00`); end.setDate(end.getDate() + Number(duration[1]) - 1); updated.endDate = localDay(end) }
  const issues = charterIssues(updated, now)
  return { booking: updated, expected: issues[0]?.field, ready: !issues.length, text: issues.length ? charterPrompt(updated, now) : '这次包车的预约信息已填好，点开卡片核对后付款。' }
}
export function charterInputDraft(booking, now = new Date()) {
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1)
  const end = new Date(`${booking.date || localDay(tomorrow)}T12:00:00`); end.setDate(end.getDate() + 1)
  const fields = transferInputDraft(booking, now).replace('目的地：龙洞堡机场T2', '想去的地方：红枫湖、青岩古镇')
  return [fields, ...(!booking.endDate ? [`结束日期：${localDay(end)}`] : [])].filter(Boolean).join('，')
}
