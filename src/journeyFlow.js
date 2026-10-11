export const PUSH_DELAY = 5000
export const INTENTION = '中秋节我们一家4口想去看大地指纹音乐节，然后想去水边露营，想去吃个状元蹄喝喝咖啡。我们24号能到贵州。'
export const INTRO = '乘客您好，很高兴为您服务。我是贵州资深司机兼导游，熟悉贵阳出发路线与景点。服务包括：定点接送、市区一日游、周边包车、商务用车、定制行程。车型【商务7座】，空间宽敞，可协助订票、推荐美食。支持在线预约，价格透明，无隐藏费用。'
export const REVIEW_EXAMPLE = '龙师傅开车很稳，行程安排得很贴心。一家人玩得很开心，露营和状元蹄都很喜欢，下次来贵州还找您！'
export const plans = [
  { id: 'transfer', number: '01', title: '纯接送', subtitle: '自由玩，接送交给龙师傅', price: 1680, tag: '灵活自由', description: '毕节往返＋贵阳周边定点接送，游玩时间自己安排。', included: ['商务7座专车，4人独立用车', '4天约定线路的定点接送', '车辆、司机、燃油、高速及停车费', '协助预订毕节住宿、门票与餐饮'], excluded: '不含陪同游览、景点讲解；住宿、门票、餐饮、营地及咖啡消费自理。', scope: '按行程单约定时间、地点接送，含每次30分钟等候；新增接送或超时先确认费用。' },
  { id: 'guided', number: '02', title: '包车＋导游', subtitle: '一家人的贵州慢游', price: 2680, tag: '司导推荐', description: '毕节食宿交通协助预订，贵阳两天包车，龙师傅全程陪玩讲解。', included: ['商务7座专车，4人独立用车', '毕节往返接送及食宿预订协助', '贵阳2天包车＋司导陪同讲解', '燃油、高速、停车及司导服务费'], excluded: '住宿、音乐节及景区门票、餐饮、营地装备和咖啡消费自理，预订前逐项确认。', scope: '贵阳每日含8小时、300公里；行程内自由调整停留时间，超出部分先沟通确认。' },
]
export const itinerary = [
  { city: '贵阳 → 毕节大方', title: '抵达贵州，安心入住', text: '08:30 贵阳龙洞堡机场接机，商务7座出发前往大方。龙师傅协助预订当地住宿与晚餐。' },
  { city: '毕节大方', title: '大地指纹音乐节', text: '酒店与音乐节场地往返接送，自由享受音乐；结束后在约定上车点接回酒店。' },
  { city: '毕节 → 贵阳', title: '去水边，慢下来', text: '早餐后返回贵阳，下午前往贵阳周边湖畔营地，留出看风景、露营和亲子时光。' },
  { city: '贵阳 · 青岩古镇', title: '状元蹄与一杯咖啡', text: '漫步青岩、品尝状元蹄，午后在咖啡馆小坐，结束后送回贵阳市区酒店。' },
]
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
  const first = tripDate(start), last = tripDate(start, 3)
  return `${tripDayLabel(start)}—${first.getMonth() === last.getMonth() ? `${last.getDate()}日` : tripDayLabel(start, 3)}`
}
export const initialJourney = () => ({ phase: 'intro', messages: [{ role: 'assistant', text: INTRO }, { role: 'assistant', text: '您这次几个人来，准备玩几天？有没有特别想去的地方？跟我说说，我帮您把路线排一排。' }], order: null })
const append = (state, phase, message, order = state.order) => ({ ...state, phase, order, messages: [...state.messages, message] })
export const autoPhases = ['reply', 'preparing', 'paid', 'departed', 'service', 'thanks', 'lost-question', 'lost-confirmation', 'lost-acknowledgement']
export function journeyReducer(state, action) {
  switch (action.type) {
    case 'RESET': return initialJourney()
    case 'SEND':
      if (state.phase !== 'intro' || !action.text.trim()) return state
      return append(state, 'reply', { role: 'user', text: action.text.trim() })
    case 'ADVANCE':
      if (state.phase === 'reply') return append(state, 'preparing', { role: 'assistant', text: '好嘞，您说的这几个地方我都熟！音乐节在毕节大方，露营和吃状元蹄可以安排在贵阳这边。咱们先去毕节听音乐，再回贵阳慢慢玩，顺路也不赶。毕节的食宿我帮您看看，贵阳这两天我开车带您一家逛。\n\n我给您整理两种走法，今天之内发给您，您看看更喜欢哪一种。' })
      if (state.phase === 'preparing') return append(state, 'plans', { type: 'plans' })
      if (state.phase === 'paid') return append(state, 'departed', { type: 'notice', label: `${tripDayLabel(state.order.start)} · 行程当天`, text: '我08:10已经出发了，预计08:30到龙洞堡机场。您收好行李，手机保持畅通，到了我给您打电话。', eta: '08:30', caption: '预计到达上车点' }, { ...state.order, status: '司机已出发' })
      if (state.phase === 'departed') return { ...state, phase: 'service', order: { ...state.order, status: '服务中' } }
      if (state.phase === 'service') return append(state, 'review', { type: 'review', label: `${tripDayLabel(state.order.start, 3)} · 服务结束` }, { ...state.order, status: '待评价' })
      if (state.phase === 'thanks') return append(state, 'lost-question', { role: 'assistant', text: state.order.rating < 5 ? '谢谢您愿意跟我说实话，这次没照顾周到的地方，跟您说声抱歉。您提的问题我会认真看，也会好好改。' : '谢谢您！您一家玩得开心，我也高兴。下次来贵州再找我，我再带您去看看别的风景，吃点地道的。' })
      if (state.phase === 'lost-question') return append(state, 'lost-confirmation', { role: 'user', text: '请问小孩的帽子是不是落在车上了？' })
      if (state.phase === 'lost-confirmation') return append(state, 'lost-acknowledgement', { role: 'assistant', text: '找到了，孩子的帽子在车上，我给您收好了。您把收件地址发我，我帮您寄回去。' })
      if (state.phase === 'lost-acknowledgement') return append(state, 'done', { role: 'user', text: '好的' })
      return state
    case 'ASK_DISCOUNT':
      if (state.phase !== 'plans' || state.discountAsked) return state
      return { ...state, discountAsked: true, messages: [...state.messages, { role: 'user', text: '价格有优惠吗' }, { role: 'assistant', text: '您想省一点我理解。这两种方案的费用都列清楚了，暂时还是按这个报价。咱们也可以按您的预算调整路线和用车安排，您看怎么样？' }] }
    case 'PAY': {
      const plan = plans.find(p => p.id === action.planId)
      if (state.phase !== 'plans' || state.order || !plan) return state
      const order = { planId: plan.id, number: action.number, amount: plan.price, start: DEFAULT_START, status: '待出行', paid: true }
      return append(state, 'paid', { role: 'assistant', kind: 'payment-confirmation', text: '收到，行程给您定好了！订单就在上方，行程单和我的电话都在里面，要改日期也可以在那里操作。出发那天我提前跟您联系，您放心。' }, order)
    }
    case 'RESCHEDULE': {
      const date = tripDate(action.start)
      if (state.phase !== 'paid' || !Number.isFinite(date.getTime())) return state
      const start = isoDate(date)
      const requested = typeof action.start === 'number' ? `2026-09-${String(action.start).padStart(2, '0')}` : action.start
      if (start !== requested || start < DEFAULT_START) return state
      return append(state, 'paid', { role: 'assistant', text: `出发日期已改为${tripDayLabel(start)}，行程顺延至${tripDayLabel(start, 3)}，价格不变。音乐节场次和住宿还有没有位置，我再帮您核实一下，确认后跟您说。` }, { ...state.order, start })
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
