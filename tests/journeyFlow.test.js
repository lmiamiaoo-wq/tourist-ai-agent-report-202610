import test from 'node:test'
import assert from 'node:assert/strict'
import { initialJourney, journeyReducer as reduce, INTENTION, plans, dateLabel } from '../src/journeyFlow.js'

const offered = () => {
  let state = reduce(initialJourney(), { type: 'SEND', text: INTENTION })
  state = reduce(state, { type: 'ADVANCE' })
  assert.equal(state.phase, 'preparing')
  assert.match(state.messages.at(-1).text, /今天之内发给您/)
  return reduce(state, { type: 'ADVANCE' })
}
const paid = (planId = 'guided') => reduce(offered(), { type: 'PAY', planId, number: 'TEST-ORDER' })

test('both offers can become one paid order at their displayed price', () => {
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
  assert.match(state.messages.find(message => message.eta).text, /08:30/)
  assert.deepEqual(reduce(state, { type: 'ADVANCE' }), state)
  state = reduce(state, { type: 'REVIEW', text: '很满意', rating: 5 })
  assert.equal(state.order.status, '已完成')
  state = reduce(state, { type: 'ADVANCE' })
  assert.equal(state.phase, 'lost-question')
  assert.deepEqual(reduce(state, { type: 'REVIEW', text: '重复评价', rating: 1 }), state)
})
test('rescheduling updates all dates, cancellation prevents every later push', () => {
  let state = reduce(paid(), { type: 'RESCHEDULE', start: 25 })
  assert.equal(dateLabel(state.order.start), '9月25日—28日')
  const departure = reduce(state, { type: 'ADVANCE' })
  assert.match(departure.messages.at(-1).label, /9月25日/)
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
  assert.equal(dateLabel(state.order.start), '9月30日—10月3日')
  const departure = reduce(state, { type: 'ADVANCE' })
  assert.match(departure.messages.at(-1).label, /9月30日/)
  const review = reduce(reduce(departure, { type: 'ADVANCE' }), { type: 'ADVANCE' })
  assert.match(review.messages.at(-1).label, /10月3日/)
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
  const messages = state.messages.slice(-3)
  assert.deepEqual(messages.map(message => message.role), ['user', 'assistant', 'user'])
  assert.match(messages[0].text, /帽子.*车上/)
  assert.match(messages[1].text, /孩子的帽子在车上.*寄回/)
  assert.equal(messages[2].text, '好的')
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

test('discount question is sent once and keeps both plans available', () => {
  let state = reduce(initialJourney(), { type: 'SEND', text: '想去贵州玩' })
  state = reduce(reduce(state, { type: 'ADVANCE' }), { type: 'ADVANCE' })
  const asked = reduce(state, { type: 'ASK_DISCOUNT' })
  assert.equal(asked.phase, 'plans')
  assert.equal(asked.messages.at(-2).text, '价格有优惠吗')
  assert.equal(asked.messages.at(-1).role, 'assistant')
  assert.deepEqual(reduce(asked, { type: 'ASK_DISCOUNT' }), asked)
  assert.equal(reduce(asked, { type: 'PAY', planId: 'guided', number: 'discount-test' }).order.amount, 2680)
  assert.deepEqual(reduce(initialJourney(), { type: 'ASK_DISCOUNT' }), initialJourney())
})
