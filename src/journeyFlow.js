import { isDailyCharter, emptyCharterBooking, charterPrompt, charterReply, charterIssues, charterAmount } from './charterConversation.js'
import { hasPendingTransfer, reduceTransferOrder } from './transferOrders.js'
import { emptyTransferBooking, transferIssue, transferKey, transferMessages, transferReply } from './transferConversation.js'
import { familyTitle, driverReply } from './familyTrip.js'
export const PUSH_DELAY = 5000
export const INTENTION = '中秋节我们一家4口想去看大地指纹音乐节，然后想去水边露营，想去吃个状元蹄喝喝咖啡。我们24号能到贵州。'
export const INTRO = '乘客您好，很高兴为您服务。我是贵州资深司机兼导游，熟悉贵阳出发路线与景点。服务包括：定点接送、市区一日游、周边包车、商务用车、定制行程。车型【商务7座】，空间宽敞，可协助订票、推荐美食。支持在线预约，价格透明，无隐藏费用。'
export const REVIEW_EXAMPLE = '龙师傅开车很稳，行程安排得很贴心。一家人玩得很开心，露营和状元蹄都很喜欢，下次来贵州还找您！'
export const plans = [{ id: 'transfer', number: '01', title: familyTitle, price: 1800, description: '一家4口 · 商务7座 · 贵阳2天包车接送', tag: '3天2晚' }]
export const DEFAULT_START = '2026-09-24'
export const vehicle = { model: '岚图梦想家', color: '蓝色', plate: '贵A·K7286', image: '/assets/business-7-seat.png' }
export function tripDate(start = DEFAULT_START, offset = 0) {
  const iso = typeof start === 'number' ? `2026-09-${String(start).padStart(2, '0')}` : start
  const date = new Date(`${iso}T12:00:00`)
  date.setDate(date.getDate() + offset)
  return date
}
export const isoDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const tripDayLabel = (start, offset = 0) => { const date = tripDate(start, offset); return `${date.getMonth() + 1}月${date.getDate()}日` }
export const dateLabel = (start = DEFAULT_START) => {
  const first = tripDate(start), last = tripDate(start, 2)
  return `${tripDayLabel(start)}—${first.getMonth() === last.getMonth() ? `${last.getDate()}日` : tripDayLabel(start, 2)}`
}
export const charterDateLabel = (start = DEFAULT_START) => `${tripDayLabel(start, 1)}-${tripDayLabel(start, 2)}`
export const initialJourney = () => ({ phase: 'intro', messages: [{ role: 'assistant', kind: 'welcome', text: INTRO }, { role: 'assistant', kind: 'family-intro', text: '您这次几个人来，准备玩几天？有没有特别想去的地方？跟我说说，我帮您安排。' }], order: null })
const append = (state, phase, message, order = state.order) => ({ ...state, phase, order, messages: [...state.messages, message] })
export const autoPhases = ['reply', 'preparing', 'paid', 'departed', 'service', 'thanks', 'lost-question', 'lost-confirmation', 'lost-acknowledgement']
export function quickActionsVisible(state, index, input = '') {
  const message = state.messages[index]
  if (!message || index !== state.messages.length - 1 || message.quickActionsDismissed || input.trim()) return false
  if (message.kind === 'transfer-intro') return !!state.transfer?.active
  if (state.transfer?.active) return false
  return (message.kind === 'suggestion' && state.phase === 'suggestion') || (message.type === 'plans' && state.phase === 'plans' && !state.consultRequested)
}
export function journeyReducer(state, action) {
  if (action.type === 'DISMISS_QUICK_ACTIONS') {
    const messages = state.messages.map(message => ['suggestion', 'transfer-intro'].includes(message.kind) || message.type === 'plans' ? { ...message, quickActionsDismissed: true } : message)
    return { ...state, messages }
  }
  if (['TRANSFER_ADVANCE', 'TRANSFER_RESCHEDULE', 'TRANSFER_CANCEL', 'TRANSFER_RATE'].includes(action.type)) return reduceTransferOrder(state, action)
  // Each service keeps its own order and lifecycle.
  if ((state.transfer?.active || hasPendingTransfer(state)) && action.type === 'ADVANCE') return state
  if (state.transfer?.active && ['BOOK_SERVICE', 'BOOK', 'DETAILS', 'CONSULT', 'THINK'].includes(action.type)) state = { ...state, transfer: { ...state.transfer, active: false } }
  switch (action.type) {
    case 'CHARTER_START': {
      const next = { ...state, transfer: state.transfer ? { ...state.transfer, active: false } : state.transfer }
      if (state.phase !== 'intro' || hasPendingTransfer(state) || state.messages.at(-1)?.kind === 'family-intro') return next
      return { ...next, messages: [...state.messages, { role: 'assistant', kind: 'family-intro', text: '您这次几个人来，准备玩几天？有没有特别想去的地方？跟我说说，我帮您安排。' }] }
    }
    case 'TRANSFER_START': {
      const daily = isDailyCharter(action.product)
      const consultationCount = (state.consultationCount || 0) + (action.fresh ? 1 : 0)
      const booking = { ...(daily ? emptyCharterBooking() : emptyTransferBooking()), ...(!action.fresh && action.booking), ...(action.fresh ? { inquiryId: `inquiry-${consultationCount}` } : {}) }
      if (!action.fresh && state.transfer?.active && state.transfer.product?.id === action.product.id && transferKey(state.transfer.booking) === transferKey(booking)) return state
      const { issue, messages } = daily ? { issue: charterIssues(booking, action.now)[0], messages: [{ role: 'assistant', text: `好的，这次按天包车重新为您安排。${charterPrompt(booking, action.now)}` }] } : transferMessages(action.product, booking, action.now)
      return { ...state, consultationCount, transfer: { active: true, product: action.product, booking, expected: issue?.field }, messages: [...state.messages, { type: 'transfer-service', product: action.product }, { role: 'user', text: `咨询/下单 · ${daily ? '按天包车' : '定点接送'}` }, ...messages] }
    }
    case 'TRANSFER_REVIEW':
      // Viewing an already-submitted transfer must not steal the composer from the next flow.
      if (state.transferSubmissions?.includes(transferKey(action.booking))) return state
      return { ...state, transfer: { active: true, product: action.product, booking: { ...action.booking } } }
    case 'TRANSFER_SEND': {
      if (!state.transfer?.active || !action.text.trim()) return state
      const result = (isDailyCharter(state.transfer.product) ? charterReply : transferReply)(action.text.trim(), state.transfer.booking, state.transfer.expected, action.now)
      return { ...state, transfer: { ...state.transfer, booking: result.booking, expected: result.expected || state.transfer.expected }, messages: [...state.messages, { role: 'user', text: action.text.trim() }, { role: 'assistant', text: result.text }, ...(result.ready ? [{ type: 'transfer-ready', product: state.transfer.product, booking: { ...result.booking } }] : [])] }
    }
    case 'TRANSFER_SUBMIT': {
      if (!state.transfer?.active || (isDailyCharter(state.transfer.product) ? charterIssues(action.booking, action.now)[0] : transferIssue(action.booking, action.now))) return state
      const key = transferKey(action.booking)
      if (state.transferSubmissions?.includes(key)) return state
      const id = action.number || `TF${(state.transferOrders?.length || 0) + 1}`
      const order = { id, number: id, product: state.transfer.product, booking: { ...action.booking }, amount: isDailyCharter(state.transfer.product) ? charterAmount(action.booking) : Number(state.transfer.product.price), paid: true, phase: 'paid', status: '待出行' }
      return { ...state, transfer: { ...state.transfer, active: false, orderId: id, booking: { ...action.booking } }, transferSubmissions: [...(state.transferSubmissions || []), key], transferOrders: [...(state.transferOrders || []), order], messages: [...state.messages, { type: 'transfer-order', orderId: id }, { role: 'assistant', text: isDailyCharter(state.transfer.product) ? '好的，这次按天包车预约已确认！用车时间和路线都在订单里，出发前我会提前与您联系。' : '好的，接送预约已确认！接送时间和路线都在订单里，要改期或取消也可以在那里操作。出发前我会提前与您联系，请保持手机畅通。' }] }
    }
    case 'RESET': return initialJourney()
    case 'SEND':
      if (state.phase !== 'intro' || !action.text.trim()) return state
      return append(state, 'reply', { role: 'user', text: action.text.trim() })
    case 'ADVANCE':
      if (state.phase === 'reply') return append(state, 'suggestion', { role: 'assistant', kind: 'suggestion', text: driverReply })
      if (state.phase === 'preparing') return append(state, 'plans', { type: 'plans' })
      if (state.phase === 'paid') return append(state, 'departed', { type: 'notice', label: `${tripDayLabel(state.order.start, 1)} · 行程当天`, text: `我已经出发了，预计${state.order.booking?.pickupAt?.slice(11) || '10:56'}到贵阳北站网约车接送区。您收好行李，手机保持畅通，到了我给您打电话。`, eta: state.order.booking?.pickupAt?.slice(11) || '10:56', caption: '预计到达上车点' }, { ...state.order, status: '司机已出发' })
      if (state.phase === 'departed') return { ...state, phase: 'service', order: { ...state.order, status: '服务中' } }
      if (state.phase === 'service') return append(state, 'review', { type: 'review', label: `${tripDayLabel(state.order.start, 2)} · 服务结束` }, { ...state.order, status: '待评价' })
      if (state.phase === 'thanks') return append(state, 'lost-question', { role: 'assistant', text: state.order.rating < 5 ? '谢谢您愿意跟我说实话，这次没照顾周到的地方，跟您说声抱歉。您提的问题我会认真看，也会好好改。' : '谢谢您！您一家玩得开心，我也高兴。下次来贵州再找我，我再带您去看看别的风景，吃点地道的。' })
      if (state.phase === 'lost-question') return append(state, 'lost-confirmation', { role: 'user', text: '请问小孩的帽子是不是落在车上了？' })
      if (state.phase === 'lost-confirmation') return append(state, 'lost-acknowledgement', { role: 'assistant', text: '找到了，孩子的帽子在车上，我给您收好了。您把收件地址发我，我帮您寄回去。' })
      if (state.phase === 'lost-acknowledgement') {
        const transferCompleted = state.transferOrders?.some(order => order.phase === 'done')
        const recommendation = transferCompleted ? [] : [{ type: 'transfer-recommendation', text: '我这边也提供贵阳出发的定点接送，车站、机场、市区和景区都能接送。商务7座，行李也放得下。您可以先看看服务详情，有用车需要随时跟我说。' }]
        return { ...state, phase: 'done', messages: [...state.messages, { role: 'user', text: '好的' }, ...recommendation] }
      }
      return state
    case 'DETAILS':
      if (!['suggestion', 'thinking'].includes(state.phase)) return state
      return { ...state, phase: 'plans', messages: [...state.messages, { role: 'user', text: '给我更详细的出行方案' }, { type: 'plans' }] }
    case 'THINK':
      if (state.phase !== 'suggestion') return state
      return { ...state, phase: 'thinking', messages: [...state.messages, { role: 'user', text: '再想想' }, { role: 'assistant', text: '好的，您慢慢考虑，想看详细安排时随时告诉我。' }] }
    case 'BOOK_SERVICE':
      if (state.order || state.phase === 'booking') return state
      return { ...state, phase: 'booking', messages: [...state.messages, { type: 'booking' }] }
    case 'BOOK':
      if (state.phase !== 'plans') return state
      return { ...state, phase: 'booking', messages: [...state.messages, { role: 'user', text: '方案不错，预定接送' }, { type: 'booking' }] }
    case 'CONSULT':
      if (state.phase !== 'plans' || state.consultRequested) return state
      return { ...state, consultRequested: true, messages: [...state.messages, { role: 'user', text: '约龙师傅电话咨询' }, { role: 'assistant', text: '好的，您方便什么时候接电话？请留下联络号码和方便的时段，我跟您详细说说这趟安排。' }] }
    case 'CONSULT_REPLY':
      if (!state.consultRequested || !action.text.trim()) return state
      return { ...state, messages: [...state.messages, { role: 'user', text: action.text.trim() }, { role: 'assistant', text: '好的，您的联络方式和时间我记下了。' }] }
    case 'PAY': {
      const plan = plans.find(p => p.id === action.planId)
      if (state.phase !== 'booking' || state.order || !plan) return state
      const order = { planId: plan.id, number: action.number, amount: plan.price, start: action.booking?.start || DEFAULT_START, booking: action.booking, status: '待出行', paid: true }
      return append(state, 'paid', { role: 'assistant', kind: 'payment-confirmation', text: '收到，行程给您定好了！订单就在上方，行程单和我的电话都在里面，要改日期也可以在那里操作。出发那天我提前跟您联系，您放心。' }, order)
    }
    case 'RESCHEDULE': {
      const date = tripDate(action.start)
      if (state.phase !== 'paid' || !Number.isFinite(date.getTime())) return state
      const start = isoDate(date)
      const requested = typeof action.start === 'number' ? `2026-09-${String(action.start).padStart(2, '0')}` : action.start
      if (start !== requested || start < DEFAULT_START) return state
      return append(state, 'paid', { role: 'assistant', text: `出发日期已改为${tripDayLabel(start)}，行程顺延至${tripDayLabel(start, 2)}，价格不变。音乐节场次和住宿还有没有位置，我再帮您核实一下，确认后跟您说。` }, { ...state.order, start })
    }
    case 'CANCEL':
      if (state.phase !== 'paid') return state
      return append(state, 'cancelled', { role: 'assistant', kind: 'cancellation-confirmation', text: '好的，订单已经取消，费用也全额退回了。这次没赶上没关系，下次来贵州再找我。' }, { ...state.order, status: '已取消', refunded: true })
    case 'REVIEW':
      if (state.phase !== 'review' || !action.text.trim() || action.rating < 1 || action.rating > 5) return state
      return { ...state, phase: 'thanks', order: { ...state.order, status: '已完成', rating: action.rating, reviewText: action.text.trim(), anonymous: !!action.anonymous, reviewTags: action.tags || [] } }
    default: return state
  }
}
