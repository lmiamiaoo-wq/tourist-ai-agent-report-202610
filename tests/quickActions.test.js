import test from 'node:test'
import assert from 'node:assert/strict'
import { initialJourney, journeyReducer as reduce, quickActionsVisible, INTENTION } from '../src/journeyFlow.js'
const suggested = () => reduce(reduce(initialJourney(), { type: 'SEND', text: INTENTION }), { type: 'ADVANCE' })
const product = { id: 'transfer', price: '268' }
const visible = state => state.messages.map((_, index) => quickActionsVisible(state, index)).filter(Boolean).length

test('typing dismisses shortcuts permanently, including after clearing the draft', () => {
  for (const state of [suggested(), reduce(suggested(), { type: 'DETAILS' }), reduce(initialJourney(), { type: 'TRANSFER_START', product })]) {
    assert.equal(visible(state), 1)
    assert.equal(quickActionsVisible(state, state.messages.length - 1, '新的输入'), false)
    const dismissed = reduce(state, { type: 'DISMISS_QUICK_ACTIONS' })
    assert.equal(visible(dismissed), 0)
    assert.equal(quickActionsVisible(dismissed, dismissed.messages.length - 1, ''), false)
  }
})
test('unselected family shortcuts do not survive switching service or a later user message', () => {
  for (const state of [suggested(), reduce(suggested(), { type: 'DETAILS' })]) {
    let next = reduce(state, { type: 'TRANSFER_START', product })
    assert.equal(quickActionsVisible(next, state.messages.length - 1), false)
    assert.equal(visible(next), 1)
    next = reduce(next, { type: 'TRANSFER_SEND', text: '先咨询费用' })
    assert.equal(visible(next), 0)
  }
})
test('selecting a shortcut hides its siblings while a new question can offer new shortcuts', () => {
  const state = reduce(suggested(), { type: 'DETAILS' })
  assert.equal(visible(state), 1)
  assert.equal(visible(reduce(state, { type: 'CONSULT' })), 0)
  assert.equal(visible(reduce(state, { type: 'BOOK' })), 0)
  const dismissed = reduce(state, { type: 'DISMISS_QUICK_ACTIONS' })
  const next = reduce(dismissed, { type: 'TRANSFER_START', product, fresh: true })
  assert.equal(visible(next), 1)
  assert.equal(quickActionsVisible(next, state.messages.length - 1), false)
})
