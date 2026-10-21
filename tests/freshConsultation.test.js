import test from 'node:test'
import assert from 'node:assert/strict'
import { journeyReducer as reduce, initialJourney } from '../src/journeyFlow.js'
import { emptyTransferBooking, transferKey } from '../src/transferConversation.js'
import { emptyCharterBooking, charterInputDraft, charterReply } from '../src/charterConversation.js'
const now = new Date('2026-10-19T10:00:00')
const transfer = { id: 'transfer', name: '定点接送', price: '268' }
const charter = { id: 'daily-charter', name: '按天包车', price: '900' }
const old = { date: '2026-10-25', time: '09:30', origin: '旧出发地', destination: '旧目的地', passengers: '2', contact: '旧联系人', phone: '13912345678' }
const start = (state, product) => reduce(state, { type: 'TRANSFER_START', product, booking: old, fresh: true, now })
const send = (state, text) => reduce(state, { type: 'TRANSFER_SEND', text, now })

test('opening transfer consultation keeps the welcome messages already shown in chat', () => {
  const initial = initialJourney()
  const next = start(initial, transfer)
  assert.deepEqual(next.messages.slice(0, initial.messages.length), initial.messages)
  assert.equal(next.messages.filter(message => message.kind === 'family-intro').length, 1)
  assert.equal(next.messages[initial.messages.length].type, 'transfer-service')
})

test('fresh homepage transfer ignores a completed booking and preserves its order', () => {
  let state = reduce(initialJourney(), { type: 'TRANSFER_START', product: transfer, booking: old, now })
  state = reduce(state, { type: 'TRANSFER_SUBMIT', booking: old, number: 'OLD', now })
  const order = state.transferOrders[0], history = state.messages
  const next = start(state, transfer)
  assert.deepEqual(next.transfer.booking, { ...emptyTransferBooking(), inquiryId: 'inquiry-1' })
  assert.equal(next.transfer.expected, 'date')
  assert.equal(next.transferOrders[0], order)
  assert.deepEqual(next.messages.slice(0, history.length), history)
  assert.equal(next.messages.slice(history.length).some(m => m.type === 'transfer-ready'), false)
  const partial = send(next, '10月27日')
  assert.equal(partial.transfer.booking.origin, '')
  assert.equal(partial.transfer.booking.contact, '')
})
test('fresh charter is writable even after the earlier family order is finished', () => {
  const oldOrder = { number: 'FAMILY', amount: 1800, status: '已完成' }
  const state = start({ ...initialJourney(), phase: 'done', order: oldOrder, consultRequested: true }, charter)
  assert.deepEqual(state.transfer.booking, { ...emptyCharterBooking(), inquiryId: 'inquiry-1' })
  assert.equal(state.order, oldOrder)
  assert.match(state.messages.at(-1).text, /开始日期.*结束日期/s)
  const next = send(state, '10月27日，09:30，出发地：新酒店，想去的地方：红枫湖、青岩古镇，3人，联系人：张女士，手机号：13712345678，结束日期：10月29日')
  assert.equal(next.messages.at(-1).type, 'transfer-ready')
  assert.equal(next.transfer.booking.endDate, '2026-10-29')
  const paid = reduce(next, { type: 'TRANSFER_SUBMIT', booking: next.transfer.booking, number: 'NEW-CHARTER', now })
  assert.equal(paid.order, oldOrder)
  assert.equal(paid.transferOrders[0].amount, 2700)
  assert.equal(paid.transferOrders[0].booking.origin, '新酒店')
  assert.equal(paid.transferOrders[0].product, charter)
})
test('new charter examples become booking data only after sending; missing fields remain empty', () => {
  const empty = emptyCharterBooking()
  const draft = charterInputDraft(empty, now)
  assert.deepEqual(empty, emptyCharterBooking())
  assert.equal(charterReply(draft, empty, 'date', now).ready, true)
  const partial = charterReply('明天，4人', empty, 'date', now)
  assert.equal(partial.ready, false)
  assert.equal(partial.booking.contact, '')
  assert.equal(partial.booking.endDate, '')
  assert.equal(charterReply('结束日期：10月18日', partial.booking, 'endDate', now).ready, false)
})
test('fresh charter has its own lifecycle, route, amount and review', () => {
  let state = send(start(initialJourney(), charter), charterInputDraft(emptyCharterBooking(), now))
  const booking = state.transfer.booking
  state = reduce(state, { type: 'TRANSFER_SUBMIT', booking, number: 'NEW', now })
  state = reduce(state, { type: 'TRANSFER_RESCHEDULE', id: 'NEW', date: '2026-11-01', time: '10:30', now })
  assert.equal(state.transferOrders[0].booking.endDate, '2026-11-02')
  for (let i = 0; i < 3; i++) state = reduce(state, { type: 'TRANSFER_ADVANCE', id: 'NEW' })
  assert.equal(state.messages.find(m => m.kind === 'transfer-departure').service, 'charter')
  state = reduce(state, { type: 'TRANSFER_RATE', id: 'NEW', rating: 5, text: '满意' })
  assert.equal(state.transferOrders[0].phase, 'done')
  assert.equal(state.messages.at(-1).type, 'transfer-recommendation')
  const next = start(state, charter)
  assert.deepEqual(next.transfer.booking, { ...emptyCharterBooking(), inquiryId: 'inquiry-2' })
  assert.equal(next.transferOrders[0], state.transferOrders[0])
  assert.notEqual(transferKey(booking), transferKey({ ...booking, endDate: '2026-10-23' }))
})

test('a new inquiry can submit the same requested details while repeat payment stays idempotent', () => {
  let state = start(initialJourney(), transfer)
  const booking = { ...old, inquiryId: state.transfer.booking.inquiryId }
  state = send(state, '10月25日，09:30，出发地：旧出发地，目的地：旧目的地，2人，联系人：旧联系人，手机号：13912345678')
  state = reduce(state, { type: 'TRANSFER_SUBMIT', booking, number: 'FIRST', now })
  state = start(state, transfer)
  const nextBooking = { ...old, inquiryId: state.transfer.booking.inquiryId }
  const paid = reduce(state, { type: 'TRANSFER_SUBMIT', booking: nextBooking, number: 'SECOND', now })
  assert.equal(paid.transferOrders.length, 2)
  assert.notEqual(transferKey(booking), transferKey(nextBooking))
  assert.deepEqual(reduce(paid, { type: 'TRANSFER_SUBMIT', booking: nextBooking, number: 'DUPLICATE', now }), paid)
})
