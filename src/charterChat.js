const cnNumbers = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }
export const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export function parseCharterReply(text, previous = {}, now = new Date()) {
  const next = { ...previous }
  const counts = [...text.matchAll(/(\d+|[一二两三四五六七八九十])\s*(?:个)?(?:人|位|成人|大人|老人|小孩|孩子|大|小)/g)]
  if (counts.length) next.people = String(counts.reduce((sum, match) => sum + (cnNumbers[match[1]] || Number(match[1])), 0))
  else if (/^\s*(\d+|[一二两三四五六七八九十])\s*$/.test(text) && !previous.people) next.people = String(cnNumbers[text.trim()] || Number(text.trim()))
  const relative = text.match(/大后天|后天|明天|今天/)
  const explicit = text.match(/(?:(\d{4})[-年/])?(\d{1,2})[-月/](\d{1,2})(?:日|号)?/)
  if (relative) {
    const date = new Date(now); date.setDate(date.getDate() + ({ 今天: 0, 明天: 1, 后天: 2, 大后天: 3 }[relative[0]])); next.date = localDate(date)
  } else if (explicit) {
    const year = Number(explicit[1] || now.getFullYear()), month = Number(explicit[2]), day = Number(explicit[3])
    const date = new Date(year, month - 1, day)
    next.date = date.getMonth() === month - 1 && date.getDate() === day ? localDate(date) : ''
  }
  const known = text.match(/黄果树(?:瀑布|景区)?|青岩(?:古镇)?|天河潭|荔波|小七孔|西江(?:千户苗寨)?|梵净山/)
  const destination = text.match(/(?:目的地[是为：:\s]*|想去|去|前往)([^，,。！!？?\s\d]{2,20})/)
  if (known) next.destination = known[0]
  else if (destination) next.destination = destination[1]
  return next
}
export function assessCharter(request, today = localDate(new Date())) {
  const missing = []
  if (!request.people || !Number.isInteger(Number(request.people)) || Number(request.people) < 1) missing.push('包车人数')
  if (!request.date || request.date < today) missing.push('出行日期（今天或之后）')
  if (!request.destination?.trim()) missing.push('目的地')
  if (missing.length) return { text: `请再告诉我${missing.join('、')}，我来帮你匹配包车服务。`, match: false }
  if (Number(request.people) > 4) return { text: `这次有${request.people}人同行，当前舒适5座车型最多可乘坐4位乘客，暂时没有匹配的可下单车型。可以调整人数后重新匹配。`, match: false }
  if (!request.destination.includes('黄果树')) return { text: `已记下${request.people}人、${request.date}前往${request.destination}。当前推荐中只有黄果树一日包车服务，暂时没有该目的地的可下单包车产品。若想去黄果树，可修改目的地后重新匹配。`, match: false }
  return { text: `为你预约黄果树一日包车：${request.people}人，${request.date}出发，舒适5座。包车1天，含8小时、300公里，￥580/天。点击下方卡片查看详情并下单。`, match: true }
}

export const welcomeMessages = () => [
  { role: 'assistant', text: '你好，我是杨通海的 AI 出行助手。杨师傅在贵州服务了8年，熟悉周边景区和沿途路况，也知道一些藏在街巷里、小众又好吃的本地饭店。想看山水、尝地道美食，都可以一起安排。' },
  { role: 'assistant', text: '这次想去哪里玩，或者想体验什么？告诉我你的想法，我来推荐合适的线路。' },
]
export const charterExamples = {
  interests: '想看看贵州的自然风景，也想吃点当地人才知道的美食。',
  destination: '我想去黄果树瀑布。',
  party: '我们一共2位大人，带2个24寸行李箱。',
  needs: '想找一家地道的小饭店吃午饭，不吃辣，行程轻松一点。',
  departure: '后天早上8:30出发，当天往返。',
  pickup: '在贵阳大十字喷泉池高空亚朵酒店大堂上车，游玩后送回酒店。',
  confirm: '改为9点出发',
  done: '能临时加景点吗',
  cancelled: '想看看贵州的自然风景，也想吃点当地人才知道的美食。',
}

export function advanceCharter(text, current = {}, now = new Date()) {
  const stage = current.stage || 'interests'
  const request = { ...current }
  const reply = (nextStage, message, extra = {}) => ({ request: { ...request, stage: nextStage }, message: { role: 'assistant', text: message, ...extra } })
  if (stage === 'interests' || stage === 'destination') {
    const parsed = parseCharterReply(text, {}, now)
    if (parsed.destination?.includes('黄果树')) {
      request.destination = '黄果树瀑布'
      return reply('party', '黄果树很适合安排一日游，沿途也能尝尝安顺的家常菜。你们一共几位同行？有小朋友或老人吗？另外带几件行李、大概多大？我来看看车辆是否坐得舒适。')
    }
    return reply('destination', '喜欢自然风景和本地美食的话，可以看看这条贵州山水线路，串联黄果树、荔波与西江，也能沿途寻找地道风味。可以参考完整线路，也可以只挑一站轻松玩。你最想去哪里？', { productId: 'guizhou-panorama-7d6n' })
  }
  if (stage === 'party') {
    const parsed = parseCharterReply(text, request, now)
    request.people = parsed.people
    const luggage = text.match(/(\d+|[一二两三四五六七八九十])\s*(?:个|件|只)?\s*(?:\d+寸)?\s*(?:行李箱|行李|箱子)/)
    if (luggage) { request.luggage = luggage[0]; request.luggageCount = cnNumbers[luggage[1]] || Number(luggage[1]) }
    if (/不带行李|没有行李|无行李/.test(text)) { request.luggage = '无行李'; request.luggageCount = 0 }
    if (!request.people || !request.luggage) return reply('party', `请再告诉我${!request.people ? '具体同行人数' : ''}${!request.people && !request.luggage ? '和' : ''}${!request.luggage ? '行李件数与大小（不带也可以）' : ''}，方便确认车辆空间。`)
    if (Number(request.people) > 4 || request.luggageCount > 2) return reply('party', '杨师傅当前的舒适5座可乘坐4位游客、放置2件行李。这个需求需要先联系司导确认更大车型，暂时不能按当前车型下单；如人数或行李有调整，可以继续告诉我。')
    return reply('needs', `记下了，${request.people}位同行，${request.luggage}，安排舒适5座。还有其他要求吗？比如餐饮口味、游玩节奏、儿童座椅，或者需要帮忙搬行李。没有也可以告诉我。`)
  }
  if (stage === 'needs') {
    request.needs = text
    return reply('departure', '你的需求已经记下，会一并放入行程方案，特殊安排由司导确认。准备哪天、几点出发？黄果树可以安排当天往返。')
  }
  if (stage === 'departure') {
    const parsed = parseCharterReply(text, {}, now)
    const time = text.match(/(\d{1,2})[:：点](\d{2}|半)?/)
    if (parsed.date) request.date = parsed.date
    if (time) request.time = `${String(Number(time[1]) + (/下午|晚上/.test(text) && Number(time[1]) < 12 ? 12 : 0)).padStart(2, '0')}:${time[2] === '半' ? '30' : time[2] || '00'}`
    const departure = new Date(`${request.date}T${request.time}`)
    if (!request.date || !request.time || !Number.isFinite(departure.getTime()) || departure.getTime() < now.getTime() + 12 * 3600000) return reply('departure', '请告诉我具体的出发日期和时间，需要至少提前12小时预约，例如「后天早上8:30」。')
    return reply('pickup', `好的，${request.date} ${request.time}出发，当天往返。最后确认一下：在哪里上车？请给我酒店名称或具体地址，也请告诉我是否原地送回。`)
  }
  if (stage === 'pickup') {
    const pickup = text.replace(/^在/, '').split(/上车|接我|接我们|[，。]/)[0].trim()
    if (pickup.length < 4) return reply('pickup', '请补充酒店全名或具体上车地址，方便司导找到你。')
    request.pickup = pickup
    request.returnTo = /送回酒店|原地|原路|原址/.test(text) ? pickup : ''
    if (!request.returnTo) return reply('pickup', '上车地点已记下。当天游玩后是否送回这个上车地点？请一起写明上车地址和返程安排。')
    return reply('confirm', '信息齐了，为你整理了黄果树一日包车方案。请核对人数、行李、时间、接送地点和其他需求，确认无误后再下单。', { plan: { ...request } })
  }
  if (stage === 'confirm') {
    const changedTime = text.match(/(?:改为|改成|调整到)\s*(\d{1,2})[:：点](\d{2}|半)?/)
    if (changedTime) {
      const hour = Number(changedTime[1]), minute = changedTime[2] === '半' ? 30 : Number(changedTime[2] || 0)
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      if (hour > 23 || minute > 59 || new Date(`${request.date}T${time}`).getTime() < now.getTime() + 12 * 3600000) return reply('confirm', '请提供有效的出发时间，并至少提前12小时预约。')
      request.time = time
      return { ...reply('confirm', `已改为${request.date} ${time}出发，上方卡片已更新，其余安排与价格不变。核对后可直接点击「立即支付」。`), updatedPlan: { ...request } }
    }
    return reply('confirm', '核对无误后，点击方案卡片上的「立即支付」即可。想调整时间，可以告诉我「改为9点出发」。')
  }
  if (stage === 'cancelled') return advanceCharter(text, {}, now)
  return reply('done', '可以联系杨师傅协商加点或调整行程；新增里程、时长可能产生费用，请在调整前确认。你也可以开启新对话规划下一次出行。')
}
