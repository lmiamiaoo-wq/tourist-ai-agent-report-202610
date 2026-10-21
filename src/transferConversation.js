// Local conversation flow for the interactive prototype. No remote booking is sent.
export const emptyTransferBooking = () => ({ date: '', time: '', origin: '', destination: '', passengers: '', contact: '', phone: '' })
export const transferFields = ['date', 'time', 'origin', 'destination', 'passengers', 'contact', 'phone']
export const localDay = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
export const transferKey = booking => JSON.stringify([...transferFields, ...(booking.endDate !== undefined ? ['endDate'] : []), ...(booking.inquiryId ? ['inquiryId'] : [])].map(key => String(booking[key] || '').trim()))
const prompts = {
  date: '您哪天用车？请告诉我日期，例如“10月25日”。',
  time: '希望几点接您？请提供具体时间，例如“上午9:30”。',
  origin: '在哪里上车？请提供车站、机场航站楼、酒店或具体地址。',
  destination: '要送到哪里？请提供目的地名称或具体地址。',
  passengers: '这次一共几位乘客？含儿童，商务7座最多乘坐6位乘客。',
  contact: '乘车联络人怎么称呼？',
  phone: '请留下乘车联络人的11位手机号，方便接送时联系。',
}
export function transferIssues(booking, now = new Date()) {
  const issues = []
  for (const field of transferFields) {
    const value = String(booking[field] || '').trim()
    if (!value) { issues.push({ field, text: prompts[field] }); continue }
    if (field === 'date') {
      const date = new Date(`${value}T12:00:00`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || localDay(date) !== value || value < localDay(now)) issues.push({ field, text: '请选择今天或之后的有效用车日期。' })
    }
    if (field === 'time' && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value) || new Date(`${booking.date}T${value}:00`) <= now)) issues.push({ field, text: '请提供尚未到达的有效接驾时间，例如“14:30”。' })
    if (field === 'destination' && value === booking.origin.trim()) issues.push({ field, text: '出发地和目的地相同，请再确认送达地点。' })
    if (field === 'passengers' && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 6)) issues.push({ field, text: '商务7座最多乘坐6位乘客，请确认1–6人的出行人数；更多乘客需要另行咨询车型。' })
    if (field === 'contact' && (value.length < 2 || value.length > 30 || /\d/.test(value))) issues.push({ field, text: '请填写有效的乘车联络人姓名或称呼。' })
    if (field === 'phone' && !/^1[3-9]\d{9}$/.test(value)) issues.push({ field, text: '手机号应为1开头的11位号码，请再确认一下。' })
  }
  return issues
}
export const transferIssue = (booking, now) => transferIssues(booking, now)[0] || null
const fieldLabels = { date: '用车日期', time: '时间', origin: '出发地', destination: '目的地', passengers: '人数', contact: '联系人', phone: '手机号' }
export function transferPrompt(booking, now = new Date()) {
  const issues = transferIssues(booking, now)
  if (!issues.length) return '请点开预约卡片核对，下单前还可修改。'
  const invalid = issues.find(issue => String(booking[issue.field] || '').trim())
  return `${invalid ? `${invalid.text} ` : ''}您把${issues.map(issue => fieldLabels[issue.field]).join('、')}一起发我，我帮您安排。`
}
// Editable demo text is offered in the composer; it becomes booking data only on Send.
export function transferInputDraft(booking, now = new Date()) {
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1)
  const examples = { date: localDay(tomorrow), time: '09:30', origin: '贵阳北站', destination: '龙洞堡机场T2', passengers: '4', contact: '林晓月', phone: '13800000000' }
  return transferIssues(booking, now).map(({ field }) => {
    if (field === 'date' || field === 'time') return examples[field]
    if (field === 'passengers') return `${examples[field]}人`
    return `${fieldLabels[field]}：${examples[field]}`
  }).join('，')
}
const chineseNumbers = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }
export function parseTransferReply(text, booking, expected, now = new Date()) {
  const patch = {}
  const source = text.trim().replaceAll('：', ':')
  const date = source.match(/(?:(\d{4})[-/年])?(\d{1,2})[-/月](\d{1,2})(?:日|号)?/)
  if (date) patch.date = `${date[1] || now.getFullYear()}-${date[2].padStart(2, '0')}-${date[3].padStart(2, '0')}`
  else if (/今天|明天|后天/.test(source)) {
    const day = new Date(now); day.setDate(day.getDate() + (/后天/.test(source) ? 2 : /明天/.test(source) ? 1 : 0)); patch.date = localDay(day)
  }
  const timeSource = source.replace(/([一二两三四五六七八九十]{1,3})(?=[点时])/g, value => {
    if (value === '十') return '10'
    if (value.includes('十')) { const [tens, units] = value.split('十'); return String((chineseNumbers[tens] || 1) * 10 + (chineseNumbers[units] || 0)) }
    return String(chineseNumbers[value])
  })
  const time = timeSource.match(/(上午|早上|中午|下午|晚上)?\s*(\d{1,2})(?::(\d{1,2})|[点时](半|\d{1,2}分?)?)/)
  if (time) {
    let hour = Number(time[2]); if (/下午|晚上/.test(time[1] || '') && hour < 12) hour += 12
    patch.time = `${String(hour).padStart(2, '0')}:${time[4] === '半' ? '30' : String(parseInt(time[3] || time[4] || '0', 10)).padStart(2, '0')}`
  }
  const people = source.match(/(\d+|[一二两三四五六七八九十])\s*(?:个)?(?:人|位|口)/)
  if (people) patch.passengers = String(chineseNumbers[people[1]] || Number(people[1]))
  const phone = source.match(/(?<!\d)1\d{10}(?!\d)/)
  if (phone) patch.phone = phone[0]
  for (const [field, label] of [['origin', '出发地|上车地点|上车点'], ['destination', '目的地|送达地点|下车点'], ['contact', '乘车联络人|联络人|联系人|姓名|我叫'], ['phone', '手机号|手机|电话']]) {
    const match = source.match(new RegExp(`(?:${label})\\s*(?:改为|改成|换成|是|为|叫|:)?\\s*([^，,；;。\\n]+)`))
    if (match) patch[field] = match[1].trim()
  }
  const route = source.match(/从([^，,；;\n]+?)(?:送到|前往|到|去)([^，,；;\n]+)/)
  if (route) { patch.origin = route[1].trim(); patch.destination = route[2].replace(/(?:接送|接我|送我|谢谢)[。！!]?$/, '').trim() }
  // A short answer to the active question is accepted only if it is not another intent/question.
  if (!Object.keys(patch).length && expected && !/[？?]|咨询|下单|预约|多少钱|怎么|什么|能否|可以|取消|谢谢|好的|确认/.test(source)) {
    if (['origin', 'destination', 'contact'].includes(expected) && source.length <= 80) patch[expected] = source.replace(/[。！!]$/, '')
    else if (['phone', 'passengers'].includes(expected) && /^\d+$/.test(source)) patch[expected] = source
  }
  return { ...booking, ...patch }
}
export function transferReply(text, booking, expected, now = new Date()) {
  const question = /[？?]|多少钱|怎么收费|费用|价格|包含|车型|行李|几座|最多|能坐|夜间|取消|退款|服务范围|能接|能送|想咨询|先咨询/.test(text)
  if (question && !/从.+(?:到|去)/.test(text)) {
    let answer = '支持贵阳出发的市区、景区和机场接送。'
    if (/钱|费|价格|包含|夜间/.test(text)) answer = '接送268元一次起，具体看您走哪条路线，过路费和停车费另算。晚上10点到早上6点用车，会加收50元夜间费。'
    else if (/车型|行李|几座|最多|能坐/.test(text)) answer = '商务7座，最多6位乘客（含儿童），大件行李需确认数量。'
    else if (/取消|退款/.test(text)) answer = '出发前24小时可免费取消，24小时内收取30%违约金；改期请联系司机。'
    return { booking, text: `${answer}\n${transferPrompt(booking, now)}` }
  }
  const updated = parseTransferReply(text, booking, expected, now)
  const issue = transferIssue(updated, now)
  return { booking: updated, expected: issue?.field, ready: !issue, text: issue ? transferPrompt(updated, now) : '预约已填好，点开卡片核对后付款。' }
}
export function transferMessages(product, booking, now = new Date()) {
  const issue = transferIssue(booking, now)
  return { issue, messages: [{ role: 'assistant', kind: issue ? 'transfer-intro' : undefined, text: issue ? `没问题，咨询或预约都可以。${transferPrompt(booking, now)}` : '预约已填好，点开卡片核对后付款。' }, ...(!issue ? [{ type: 'transfer-ready', product, booking: { ...booking } }] : [])] }
}
