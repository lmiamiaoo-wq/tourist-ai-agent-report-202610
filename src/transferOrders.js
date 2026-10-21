import { isDailyCharter, charterIssues } from './charterConversation.js'
import { transferIssue, transferKey, localDay } from './transferConversation.js'

export const transferAutoPhases = ['paid', 'departed', 'service']
export const transferOrderFinished = order => ['review', 'done', 'cancelled'].includes(order.phase)
export const hasPendingTransfer = state => (state.transferOrders || []).some(order => !['done', 'cancelled'].includes(order.phase))

function updateOrder(state, order, messages = []) {
  return { ...state, transferOrders: state.transferOrders.map(item => item.id === order.id ? order : item), messages: [...state.messages, ...messages] }
}
function resumeFamily(state) {
  if (state.transferOrders?.some(order => isDailyCharter(order.product)) || hasPendingTransfer(state) || state.phase !== 'intro' || state.messages.some(message => message.kind === 'family-intro')) return state
  return { ...state, messages: [...state.messages, { role: 'assistant', kind: 'family-intro', text: '您这次几个人来，准备玩几天？有没有特别想去的地方？跟我说说，我帮您安排。' }] }
}
export function reduceTransferOrder(state, action) {
  const order = state.transferOrders?.find(item => item.id === action.id)
  if (!order) return state
  const say = text => ({ role: 'assistant', text })
  switch (action.type) {
    case 'TRANSFER_ADVANCE':
      if (order.phase === 'paid') return updateOrder(state, { ...order, phase: 'departed', status: '司机已出发' }, [{ ...say(`我已经出发了，预计${order.booking.time}到${order.booking.origin}。您收好行李，手机保持畅通，到了我给您打电话。`), kind: 'transfer-departure', service: isDailyCharter(order.product) ? 'charter' : 'transfer' }])
      if (order.phase === 'departed') return updateOrder(state, { ...order, phase: 'service', status: '服务中' })
      if (order.phase === 'service') return updateOrder(state, { ...order, phase: 'review', status: '待评价' }, [say(isDailyCharter(order.product) ? '这次包车行程结束啦，感谢您的信任！这几天玩得怎么样？' : `已送达${order.booking.destination}，感谢您的信任！这次接送还满意吗？`), { type: 'transfer-review', orderId: order.id }])
      return state
    case 'TRANSFER_RESCHEDULE': {
      if (order.phase !== 'paid') return state
      const booking = { ...order.booking, date: action.date, time: action.time }
      if (isDailyCharter(order.product)) {
        const days = Math.round((new Date(`${order.booking.endDate}T12:00:00`) - new Date(`${order.booking.date}T12:00:00`)) / 86400000)
        const end = new Date(`${action.date}T12:00:00`); end.setDate(end.getDate() + days)
        if (!Number.isFinite(end.getTime())) return state
        booking.endDate = localDay(end)
      }
      if (isDailyCharter(order.product) ? charterIssues(booking, action.now).length : transferIssue(booking, action.now)) return state
      const key = transferKey(booking)
      if (state.transferOrders.some(item => item.id !== order.id && transferKey(item.booking) === key)) return state
      const next = updateOrder(state, { ...order, booking }, [say(`接送时间已改为${booking.date} ${booking.time}，从${booking.origin}到${booking.destination}，其他预约信息不变。`)])
      return { ...next, transferSubmissions: [...new Set([...state.transferSubmissions, key])], transfer: state.transfer?.orderId === order.id ? { ...state.transfer, booking } : state.transfer }
    }
    case 'TRANSFER_CANCEL':
      if (order.phase !== 'paid') return state
      return resumeFamily(updateOrder(state, { ...order, phase: 'cancelled', status: '已取消', refunded: true }, [say('好的，这次接送已取消，费用已全额退回。以后需要用车，随时找我。')]))
    case 'TRANSFER_RATE': {
      if (order.phase !== 'review' || ![1, 3, 5].includes(action.rating) || !action.text?.trim()) return state
      const updated = updateOrder(state, { ...order, phase: 'done', status: '已完成', rating: action.rating, reviewText: action.text.trim(), reviewTags: action.tags || [], anonymous: !!action.anonymous }, [say(action.rating < 5 ? '谢谢您的反馈，没照顾周到的地方我会认真改进。' : isDailyCharter(order.product) ? '谢谢您的认可！下次需要包车，随时找我。' : '谢谢您的认可！下次需要接送，随时找我。')])
      if (isDailyCharter(order.product) && !state.transferOrders.some(item => !isDailyCharter(item.product) && item.phase === 'done')) return { ...updated, messages: [...updated.messages, { type: 'transfer-recommendation', text: '我这边也提供贵阳出发的定点接送，车站、机场、市区和景区都能接送。有用车需要随时跟我说。' }] }
      return resumeFamily(updated)
    }
    default: return state
  }
}
