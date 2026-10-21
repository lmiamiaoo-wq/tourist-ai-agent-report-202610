import test from 'node:test'
import assert from 'node:assert/strict'
import { initialJourney, journeyReducer as reduce, INTENTION, INTRO, plans, dateLabel, charterDateLabel } from '../src/journeyFlow.js'

const suggested = () => reduce(reduce(initialJourney(), { type: 'SEND', text: INTENTION }), { type: 'ADVANCE' })
const offered = () => reduce(suggested(), { type: 'DETAILS' })
const paid = (planId = 'transfer') => reduce(reduce(offered(), { type: 'BOOK' }), { type: 'PAY', planId, number: 'TEST-ORDER' })

test('the family offer becomes one paid order at its displayed price', () => {
  for (const plan of plans) {
    const state = paid(plan.id)
    assert.equal(state.order.amount, plan.price)
    assert.equal(state.phase, 'paid')
    assert.deepEqual(reduce(state, { type: 'PAY', planId: plan.id, number: 'DUPLICATE' }), state)
  }
  assert.equal(reduce(initialJourney(), { type: 'PAY', planId: 'guided' }).order, null)
})
test('paid order progresses through departure, service and review only once', () => {
  let state = paid()
  for (const phase of ['departed', 'service', 'review']) {
    state = reduce(state, { type: 'ADVANCE' })
    assert.equal(state.phase, phase)
  }
  assert.match(state.messages.find(message => message.eta).text, /10:56/)
  assert.deepEqual(reduce(state, { type: 'ADVANCE' }), state)
  state = reduce(state, { type: 'REVIEW', text: '很满意', rating: 5 })
  assert.equal(state.order.status, '已完成')
  state = reduce(state, { type: 'ADVANCE' })
  assert.equal(state.phase, 'lost-question')
  assert.deepEqual(reduce(state, { type: 'REVIEW', text: '重复评价', rating: 1 }), state)
})
test('rescheduling updates all dates, cancellation prevents every later push', () => {
  let state = reduce(paid(), { type: 'RESCHEDULE', start: 25 })
  assert.equal(dateLabel(state.order.start), '9月25日—27日')
  const departure = reduce(state, { type: 'ADVANCE' })
  assert.match(departure.messages.at(-1).label, /9月26日/)
  state = reduce(state, { type: 'CANCEL' })
  assert.equal(state.order.refunded, true)
  for (let n = 0; n < 5; n++) assert.deepEqual(reduce(state, { type: 'ADVANCE' }), state)
  assert.equal(reduce(state, { type: 'RESET' }).order, null)
})
test('invalid and out-of-sequence edits cannot mutate the booking', () => {
  const state = paid()
  assert.deepEqual(reduce(state, { type: 'RESCHEDULE', start: 99 }), state)
  assert.deepEqual(reduce(state, { type: 'REVIEW', text: '提前评价', rating: 5 }), state)
  const departed = reduce(state, { type: 'ADVANCE' })
  assert.deepEqual(reduce(departed, { type: 'CANCEL' }), departed)
  assert.deepEqual(reduce(initialJourney(), { type: 'SEND', text: ' ' }), initialJourney())
})

test('calendar rescheduling rolls the itinerary and notices into the next month', () => {
  const state = reduce(paid(), { type: 'RESCHEDULE', start: '2026-09-30' })
  assert.equal(dateLabel(state.order.start), '9月30日—10月2日')
  const departure = reduce(state, { type: 'ADVANCE' })
  assert.match(departure.messages.at(-1).label, /10月1日/)
  const review = reduce(reduce(departure, { type: 'ADVANCE' }), { type: 'ADVANCE' })
  assert.match(review.messages.at(-1).label, /10月2日/)
  assert.deepEqual(reduce(state, { type: 'RESCHEDULE', start: '2026-09-31' }), state)
  assert.deepEqual(reduce(state, { type: 'RESCHEDULE', start: '2026-09-01' }), state)
})

test('service begins without adding the removed pickup notice', () => {
  const departed = reduce(paid(), { type: 'ADVANCE' })
  const serving = reduce(departed, { type: 'ADVANCE' })
  assert.equal(serving.order.status, '服务中')
  assert.deepEqual(serving.messages, departed.messages)
  assert.equal(reduce(serving, { type: 'ADVANCE' }).phase, 'review')
})

test('all three feedback levels preserve tags and anonymity and submit once', () => {
  for (const rating of [1, 3, 5]) {
    let state = paid()
    for (let n = 0; n < 3; n++) state = reduce(state, { type: 'ADVANCE' })
    const action = { type: 'REVIEW', rating, text: '服务评价', tags: ['接送准时'], anonymous: true }
    const submitted = reduce(state, action)
    assert.equal(submitted.order.rating, rating)
    assert.deepEqual(submitted.order.reviewTags, ['接送准时'])
    assert.equal(submitted.order.anonymous, true)
    assert.deepEqual(submitted.messages, state.messages)
    assert.equal(submitted.order.reviewText, '服务评价')
    assert.equal(submitted.phase, 'thanks')
    assert.match(reduce(submitted, { type: 'ADVANCE' }).messages.at(-1).text, rating < 5 ? /也会好好改/ : /您一家玩得开心/)
    assert.deepEqual(reduce(submitted, action), submitted)
  }
})

test('completed order runs the lost-hat exchange once and remains completed', () => {
  let state = paid()
  for (let i = 0; i < 3; i++) state = reduce(state, { type: 'ADVANCE' })
  state = reduce(state, { type: 'REVIEW', text: '谢谢', rating: 5 })
  for (let i = 0; i < 4; i++) state = reduce(state, { type: 'ADVANCE' })
  assert.equal(state.phase, 'done')
  assert.equal(state.order.status, '已完成')
  const messages = state.messages.filter(message => message.type !== 'transfer-recommendation').slice(-3)
  assert.deepEqual(messages.map(message => message.role), ['user', 'assistant', 'user'])
  assert.match(messages[0].text, /帽子.*车上/)
  assert.match(messages[1].text, /孩子的帽子在车上.*寄回/)
  assert.equal(messages[2].text, '好的')
  assert.equal(state.messages.at(-1).type, 'transfer-recommendation')
  assert.equal(state.messages.filter(message => message.type === 'transfer-recommendation').length, 1)
  assert.deepEqual(reduce(state, { type: 'ADVANCE' }), state)
})

test('cancelled order anchors its expanded history card to the cancellation notice', () => {
  const state = reduce(paid(), { type: 'CANCEL' })
  assert.equal(state.phase, 'cancelled')
  assert.equal(state.order.status, '已取消')
  assert.equal(state.order.refunded, true)
  assert.equal(state.messages.at(-1).kind, 'cancellation-confirmation')
  assert.equal(state.messages.filter(message => message.kind === 'cancellation-confirmation').length, 1)
  assert.deepEqual(reduce(state, { type: 'CANCEL' }), state)
})

test('default conversation waits for visitor input before the reply and choices', () => {
  const initial = initialJourney()
  assert.equal(initial.phase, 'intro')
  assert.equal(initial.messages[0].text, INTRO)
  assert.equal(initial.messages[0].kind, 'welcome')
  assert.equal(initial.messages.length, 2)
  assert.match(initial.messages[1].text, /您这次几个人来/)
  const reply = suggested()
  assert.equal(reply.messages[2].text, INTENTION)
  assert.match(reply.messages[3].text, /毕节的食宿我帮您订/)
  assert.equal(reply.phase, 'suggestion')
  assert.deepEqual(reduce(initial, { type: 'ADVANCE' }), initial)
  const thinking = reduce(reply, { type: 'THINK' })
  const offered = reduce(thinking, { type: 'DETAILS' })
  assert.equal(offered.messages.filter(m => m.type === 'plans').length, 1)
  assert.deepEqual(reduce(offered, { type: 'DETAILS' }), offered)
  assert.equal(reduce(offered, { type: 'PAY', planId: 'transfer' }).order, null)
})
test('consultation preserves booking and submitted reservation fields', () => {
  const state = reduce(offered(), { type: 'CONSULT' })
  assert.deepEqual(reduce(state, { type: 'CONSULT' }), state)
  const replied = reduce(state, { type: 'CONSULT_REPLY', text: '请明天下午联系' })
  const booking = { start: '2026-09-26', pickupAt: '2026-09-27T10:56', passengers: '4', contact: '林晓月', phone: '13800000000' }
  const result = reduce(reduce(replied, { type: 'BOOK' }), { type: 'PAY', planId: 'transfer', number: 'TEST', booking })
  assert.equal(result.order.amount, 1800)
  assert.deepEqual(result.order.booking, booking)
  assert.equal(result.order.start, booking.start)
})

test('storefront charter can start booking without a chat plan and preserves existing orders', () => {
  const initial = initialJourney()
  const booking = reduce(initial, { type: 'BOOK_SERVICE' })
  assert.equal(booking.phase, 'booking')
  assert.deepEqual(booking.messages.slice(0, initial.messages.length), initial.messages)
  const state = reduce(booking, { type: 'PAY', planId: plans[0].id, number: 'STOREFRONT-ORDER' })
  assert.equal(state.order.number, 'STOREFRONT-ORDER')
  assert.equal(state.order.amount, plans[0].price)
  assert.deepEqual(reduce(state, { type: 'BOOK_SERVICE' }), state)
})


test('shared two-day service range stays consistent across month boundaries', () => {
  assert.equal(charterDateLabel(), '9月25日-9月26日')
  assert.equal(charterDateLabel('2026-09-30'), '10月1日-10月2日')
})

test('charter consultation switches away from a transfer draft without losing booking data', () => {
  const booking = { origin: '贵阳北站', passengers: '4' }
  const state = { ...initialJourney(), messages: [{ role: 'user', text: '先问接送' }], transfer: { active: true, booking } }
  const next = reduce(state, { type: 'CHARTER_START' })
  assert.equal(next.transfer.active, false)
  assert.deepEqual(next.transfer.booking, booking)
  assert.equal(next.messages.at(-1).kind, 'family-intro')
  assert.deepEqual(reduce(next, { type: 'CHARTER_START' }), next)
  assert.equal(reduce(next, { type: 'SEND', text: INTENTION }).phase, 'reply')
})

test('charter consultation preserves an existing order and its lifecycle', () => {
  const state = paid()
  const next = reduce(state, { type: 'CHARTER_START' })
  assert.equal(next.order, state.order)
  assert.equal(next.phase, state.phase)
  assert.equal(next.messages, state.messages)
})
