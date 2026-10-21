import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyTransferBooking, transferIssue, transferReply, transferKey, transferInputDraft } from '../src/transferConversation.js'
import { initialJourney, INTENTION, journeyReducer as reduce } from '../src/journeyFlow.js'
const now = new Date('2026-10-19T10:00:00')
const product = { id: 'huangguoshu', name: '定点接送', price: '268' }
const complete = { date: '2026-10-25', time: '09:30', origin: '贵阳北站', destination: '龙洞堡机场T2', passengers: '4', contact: '林女士', phone: '13800000000' }
const start = booking => reduce(initialJourney(), { type: 'TRANSFER_START', product, booking, now })
const send = (state, text) => reduce(state, { type: 'TRANSFER_SEND', text, now })

test('collects seven fields across turns and emits a card only after completion', () => {
  let state = start(emptyTransferBooking())
  for (const text of ['我要预约接送', '10月25日', '上午9:30', '贵阳北站', '龙洞堡机场T2', '四人', '林女士']) {
    state = send(state, text)
    assert.equal(state.messages.some(m => m.type === 'transfer-ready'), false)
  }
  state = send(state, '13800000000')
  assert.deepEqual(state.transfer.booking, complete)
  assert.deepEqual(state.messages.at(-1).booking, complete)
  assert.equal(state.order, null)
})
test('one natural sentence fills a card, corrections preserve its previous snapshot', () => {
  let state = send(start(), '10月25日上午9:30，从贵阳北站到龙洞堡机场T2，4人，联系人林女士，电话13800000000')
  assert.deepEqual(state.messages.at(-1).booking, complete)
  const previous = state.messages.at(-1)
  state = send(state, '改为下午2点半，3人')
  assert.equal(state.messages.at(-1).booking.time, '14:30')
  assert.equal(state.messages.at(-1).booking.passengers, '3')
  assert.deepEqual(previous.booking, complete)
})
test('consultation preserves data and cannot create an order', () => {
  let state = send(start({ date: '2026-10-25' }), '先咨询费用')
  assert.match(state.messages.at(-1).text, /268元/)
  assert.equal(state.transfer.booking.date, '2026-10-25')
  assert.equal(state.messages.some(m => m.type === 'transfer-ready'), false)
  assert.equal(state.order, null)
  state = send(state, '最多能坐几人？')
  assert.match(state.messages.at(-1).text, /6位/)
})
test('validation rejects impossible dates, past times, excess passengers and invalid phone', () => {
  for (const patch of [{ date: '2026-02-30' }, { date: '2026-10-18' }, { date: '2026-10-19', time: '09:30' }, { time: '25:00' }, { passengers: '7' }, { passengers: '0' }, { phone: '138000' }, { contact: '' }, { destination: complete.origin }]) assert.ok(transferIssue({ ...complete, ...patch }, now))
  assert.equal(transferIssue(complete, now), null)
  let state = start({ ...complete, phone: '' })
  state = send(state, '13800')
  assert.match(state.messages.at(-1).text, /11位/)
  assert.notEqual(state.messages.at(-1).type, 'transfer-ready')
  state = send(state, '13800000000')
  assert.equal(state.messages.at(-1).type, 'transfer-ready')
})
test('existing form input is preserved and relative dates cross a month boundary', () => {
  const state = start({ ...complete, phone: '' })
  assert.equal(state.transfer.expected, 'phone')
  const reply = transferReply('后天上午9点，从贵阳北站到龙洞堡机场T2，2人，联系人林女士，电话13800000000', emptyTransferBooking(), 'date', new Date('2026-10-31T10:00:00'))
  assert.equal(reply.booking.date, '2026-11-02')
  assert.equal(reply.ready, true)
})
test('transfer pauses family automation; local submit is validated and idempotent', () => {
  let state = start(complete)
  assert.deepEqual(reduce(state, { type: 'ADVANCE' }), state)
  assert.deepEqual(reduce(state, { type: 'TRANSFER_SUBMIT', booking: { ...complete, phone: '' }, now }), state)
  const action = { type: 'TRANSFER_SUBMIT', booking: complete, now }
  state = reduce(state, action)
  assert.deepEqual(state.transferSubmissions, [transferKey(complete)])
  assert.deepEqual(reduce(state, action), state)
  assert.ok(state.messages.some(message => /接送预约已确认/.test(message.text || '')))
})

test('Chinese time, passenger count and labeled corrections are recognized', () => {
  let state = send(start(), '明天下午三点半，从贵阳北站到机场，四个人，联系人是林女士，手机号13800000000。')
  assert.equal(state.transfer.booking.time, '15:30')
  assert.equal(state.transfer.booking.passengers, '4')
  assert.equal(state.transfer.booking.phone, '13800000000')
  assert.equal(state.messages.at(-1).type, 'transfer-ready')
  state = send(state, '联系人改为张先生')
  assert.equal(state.messages.at(-1).booking.contact, '张先生')
})
test('an earlier reservation card resumes transfer review after switching services', () => {
  let state = reduce(start(complete), { type: 'BOOK_SERVICE' })
  assert.equal(state.transfer.active, false)
  state = reduce(state, { type: 'TRANSFER_REVIEW', product, booking: complete })
  assert.equal(state.transfer.active, true)
  state = reduce(state, { type: 'TRANSFER_SUBMIT', booking: complete, now })
  assert.equal(state.transferSubmissions.length, 1)
})


test('entry shows the service before the user message and asks for all fields once', () => {
  const state = start()
  assert.equal(state.messages[1].kind, 'family-intro')
  assert.equal(state.messages[2].type, 'transfer-service')
  assert.equal(state.messages[3].text, '咨询/下单 · 定点接送')
  assert.equal(state.messages.length, 5)
  for (const label of ['用车日期', '时间', '出发地', '目的地', '人数', '联系人', '手机号']) assert.ok(state.messages.at(-1).text.includes(label))
})
test('editable input example completes all fields in one send without mutating the draft', () => {
  const booking = emptyTransferBooking()
  const text = transferInputDraft(booking, now)
  assert.deepEqual(booking, emptyTransferBooking())
  const state = send(start(booking), text)
  assert.equal(state.messages.at(-1).type, 'transfer-ready')
  assert.equal(state.transfer.booking.date, '2026-10-20')
  assert.equal(transferInputDraft(state.transfer.booking, now), '')
})
test('partial replies group missing fields and suggested text preserves existing choices', () => {
  let state = send(start(), '10月25日14:30，从贵阳北站到青岩古镇')
  assert.match(state.messages.at(-1).text, /人数、联系人、手机号/)
  const text = transferInputDraft(state.transfer.booking, now)
  assert.equal(text, '4人，联系人：林晓月，手机号：13800000000')
  state = send(state, text)
  assert.equal(state.transfer.booking.time, '14:30')
  assert.equal(state.transfer.booking.destination, '青岩古镇')
  assert.equal(state.messages.at(-1).type, 'transfer-ready')
})


test('transfer first completes its service before resuming the original family booking', () => {
  let state = start()
  assert.equal(state.messages.filter(message => message.kind === 'family-intro').length, 1)
  state = send(state, transferInputDraft(state.transfer.booking, now))
  const booking = state.transfer.booking
  const submit = { type: 'TRANSFER_SUBMIT', booking, now }
  state = reduce(state, submit)
  assert.equal(state.phase, 'intro')
  assert.equal(state.transfer.active, false)
  assert.notEqual(state.messages.at(-1).kind, 'family-intro')
  const id = state.transferOrders[0].id
  for (let i = 0; i < 3; i++) state = reduce(state, { type: 'TRANSFER_ADVANCE', id })
  state = reduce(state, { type: 'TRANSFER_RATE', id, rating: 5, text: '接送准时' })
  assert.equal(state.messages.filter(message => message.kind === 'family-intro').length, 1)
  assert.equal(state.messages.find(message => message.kind === 'family-intro').text, '您这次几个人来，准备玩几天？有没有特别想去的地方？跟我说说，我帮您安排。')
  assert.deepEqual(reduce(state, submit), state)
  assert.deepEqual(reduce(state, { type: 'TRANSFER_REVIEW', product, booking }), state)
  state = reduce(state, { type: 'SEND', text: INTENTION })
  assert.equal(state.phase, 'reply')
  state = reduce(state, { type: 'ADVANCE' })
  state = reduce(state, { type: 'DETAILS' })
  state = reduce(state, { type: 'BOOK' })
  state = reduce(state, { type: 'PAY', planId: 'transfer', number: 'FAMILY-AFTER-TRANSFER' })
  assert.equal(state.order.number, 'FAMILY-AFTER-TRANSFER')
  assert.equal(state.transferSubmissions.length, 1)
  assert.deepEqual(state.transfer.booking, booking)
  const transferOrder = state.transferOrders[0]
  for (let i = 0; i < 3; i++) state = reduce(state, { type: 'ADVANCE' })
  state = reduce(state, { type: 'REVIEW', rating: 5, text: '很满意' })
  for (let i = 0; i < 4; i++) state = reduce(state, { type: 'ADVANCE' })
  assert.equal(state.order.status, '已完成')
  assert.deepEqual(state.transferOrders[0], transferOrder)
  assert.equal(state.phase, 'done')
  assert.equal(state.messages.at(-1).text, '好的')
  assert.equal(state.messages.some(message => message.type === 'transfer-recommendation'), false)
  assert.deepEqual(reduce(state, { type: 'ADVANCE' }), state)
  assert.deepEqual(reduce(state, { type: 'TRANSFER_ADVANCE', id }), state)
})
test('family first preserves its finished order and does not replay the family flow after transfer', () => {
  let state = reduce(initialJourney(), { type: 'SEND', text: INTENTION })
  for (const action of [{ type: 'ADVANCE' }, { type: 'DETAILS' }, { type: 'BOOK' }, { type: 'PAY', planId: 'transfer', number: 'FAMILY-FIRST' }, { type: 'ADVANCE' }, { type: 'ADVANCE' }, { type: 'ADVANCE' }, { type: 'REVIEW', rating: 5, text: '很好' }, { type: 'ADVANCE' }, { type: 'ADVANCE' }, { type: 'ADVANCE' }, { type: 'ADVANCE' }]) state = reduce(state, action)
  assert.equal(state.phase, 'done')
  assert.equal(state.messages.at(-1).type, 'transfer-recommendation')
  const order = state.order
  const before = state.messages.length
  state = reduce(state, { type: 'TRANSFER_START', product, booking: complete, now })
  state = reduce(state, { type: 'TRANSFER_SUBMIT', booking: complete, now })
  assert.deepEqual(state.order, order)
  assert.equal(state.phase, 'done')
  assert.equal(state.transfer.active, false)
  const id = state.transferOrders[0].id
  for (let i = 0; i < 3; i++) state = reduce(state, { type: 'TRANSFER_ADVANCE', id })
  state = reduce(state, { type: 'TRANSFER_RATE', id, rating: 5, text: '很满意' })
  assert.deepEqual(state.order, order)
  assert.equal(state.messages.slice(before).some(message => message.kind === 'family-intro'), false)
  assert.match(state.messages.at(-1).text, /谢谢您的认可/)
  assert.equal(state.messages.filter(message => message.type === 'transfer-recommendation').length, 1)
  assert.deepEqual(reduce(state, { type: 'ADVANCE' }), state)
  assert.deepEqual(reduce(state, { type: 'TRANSFER_ADVANCE', id }), state)
})


test('transfer payment creates a separate immutable order and a single card', () => {
  const booking = { ...complete }
  let state = start(booking)
  const pay = { type: 'TRANSFER_SUBMIT', booking, number: 'TF-TEST', now }
  state = reduce(state, pay)
  assert.equal(state.order, null)
  assert.equal(state.transferOrders.length, 1)
  const order = state.transferOrders[0]
  assert.deepEqual(order.booking, complete)
  assert.equal(order.status, '待出行')
  assert.equal(order.amount, 268)
  assert.equal(order.paid, true)
  booking.origin = '其他地点'
  assert.equal(order.booking.origin, complete.origin)
  assert.equal(state.messages.filter(message => message.type === 'transfer-order').length, 1)
  assert.deepEqual(reduce(state, { ...pay, booking: complete }), state)
  assert.deepEqual(reduce(state, { type: 'ADVANCE' }), state)
})

test('transfer lifecycle delivers to its own destination and evaluates exactly once', () => {
  let state = reduce(start(complete), { type: 'TRANSFER_SUBMIT', booking: complete, now })
  const id = state.transferOrders[0].id
  for (const status of ['司机已出发', '服务中', '待评价']) {
    state = reduce(state, { type: 'TRANSFER_ADVANCE', id })
    assert.equal(state.transferOrders[0].status, status)
  }
  assert.ok(state.messages.some(message => message.text?.includes(`预计${complete.time}到${complete.origin}`)))
  assert.ok(state.messages.some(message => message.text?.includes(`已送达${complete.destination}`)))
  assert.equal(state.messages.filter(message => message.type === 'transfer-review').length, 1)
  assert.deepEqual(reduce(state, { type: 'TRANSFER_ADVANCE', id }), state)
  assert.deepEqual(reduce(state, { type: 'TRANSFER_RATE', id, rating: 6, text: '满意' }), state)
  const review = { type: 'TRANSFER_RATE', id, rating: 3, text: '车辆整洁', tags: ['车辆整洁'] }
  state = reduce(state, review)
  assert.equal(state.transferOrders[0].status, '已完成')
  assert.deepEqual(state.transferOrders[0].reviewTags, ['车辆整洁'])
  assert.deepEqual(reduce(state, review), state)
})

test('transfer rescheduling validates date and time and updates the departure message', () => {
  let state = reduce(start(complete), { type: 'TRANSFER_SUBMIT', booking: complete, now })
  const id = state.transferOrders[0].id
  for (const values of [{ date: '2026-02-30', time: '09:30' }, { date: '2026-10-18', time: '09:30' }, { date: '2026-10-26', time: '29:00' }]) {
    assert.deepEqual(reduce(state, { type: 'TRANSFER_RESCHEDULE', id, ...values, now }), state)
  }
  state = reduce(state, { type: 'TRANSFER_RESCHEDULE', id, date: '2026-11-01', time: '14:00', now })
  assert.equal(state.transferOrders[0].booking.date, '2026-11-01')
  assert.equal(state.transferOrders[0].booking.time, '14:00')
  assert.equal(state.transferOrders[0].amount, 268)
  assert.equal(state.transfer.booking.date, '2026-11-01')
  state = reduce(state, { type: 'TRANSFER_ADVANCE', id })
  assert.match(state.messages.at(-1).text, /预计14:00到贵阳北站/)
  assert.deepEqual(reduce(state, { type: 'TRANSFER_CANCEL', id }), state)
})

test('transfer cancellation stops service pushes and keeps the original family prompt once', () => {
  let state = reduce(start(complete), { type: 'TRANSFER_SUBMIT', booking: complete, now })
  const id = state.transferOrders[0].id
  state = reduce(state, { type: 'TRANSFER_CANCEL', id })
  assert.equal(state.transferOrders[0].status, '已取消')
  assert.equal(state.transferOrders[0].refunded, true)
  assert.equal(state.messages.filter(message => message.kind === 'family-intro').length, 1)
  for (const type of ['TRANSFER_ADVANCE', 'TRANSFER_CANCEL', 'TRANSFER_RATE']) assert.deepEqual(reduce(state, { type, id, rating: 5, text: '很好' }), state)
})


test('reopening the same transfer consultation preserves the draft without duplicating messages', () => {
  let state = start()
  state = send(state, '10月25日14:30，从贵阳北站到青岩古镇')
  assert.deepEqual(reduce(state, { type: 'TRANSFER_START', product, booking: state.transfer.booking, now }), state)
})

test('transfer departure marks its service recommendations once', () => {
  let state = reduce(start(complete), { type: 'TRANSFER_SUBMIT', booking: complete, now })
  const id = state.transferOrders[0].id
  state = reduce(state, { type: 'TRANSFER_ADVANCE', id })
  assert.equal(state.messages.at(-1).kind, 'transfer-departure')
  state = reduce(state, { type: 'TRANSFER_ADVANCE', id })
  assert.equal(state.messages.filter(message => message.kind === 'transfer-departure').length, 1)
})
