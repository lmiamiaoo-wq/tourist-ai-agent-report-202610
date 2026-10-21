import { isDailyCharter } from './charterConversation'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeftIcon, CalendarCheckIcon, CaretDownIcon, CaretRightIcon, PhoneIcon, ReceiptIcon, XIcon } from '@phosphor-icons/react'
import Price from './Price'
import MobileDatePicker from './MobileDatePicker'
import { localDay, transferIssue } from './transferConversation'
import { transferOrderFinished } from './transferOrders'
import { vehicle } from './journeyFlow'

function TransferFields({ booking, showTime = true, showPassenger = true }) {
  return <dl className="journey-fields transfer-order-fields">
    {showTime && <div><dt>{booking.endDate ? '用车时间' : '接送时间'}</dt><dd>{booking.date} {booking.time}{booking.endDate && ` 至 ${booking.endDate}`}</dd></div>}
    <div><dt>出发地</dt><dd>{booking.origin}</dd></div>
    <div><dt>{booking.endDate ? '行程路线' : '目的地'}</dt><dd>{booking.destination}</dd></div>
    {showPassenger && <><div><dt>乘车信息</dt><dd>{booking.passengers}人 · {booking.contact} · 商务7座</dd></div>
    <div><dt>联系手机</dt><dd>{booking.phone}</dd></div></>}
  </dl>
}
export function TransferOrderCard({ order, onOpen }) {
  const [expanded, setExpanded] = useState(false)
  const finished = transferOrderFinished(order)
  return <section className={`journey-order${finished ? ' journey-order-history' : ''}`} aria-label={isDailyCharter(order.product) ? '按天包车订单' : '定点接送订单'}>
    <div className="journey-order-summary"><strong>{isDailyCharter(order.product) ? '按天包车' : '定点接送'} · 商务7座</strong><span className={`journey-pinned-status${order.refunded ? ' muted' : ''}`}>{order.status}</span></div>
    <div className="journey-order-meta"><p>{order.booking.date} {order.booking.time}{order.booking.endDate && ` 至 ${order.booking.endDate}`}</p>{!finished && <button className="journey-order-toggle" type="button" aria-expanded={expanded} aria-controls={`transfer-order-${order.id}`} onClick={() => setExpanded(value => !value)}>{expanded ? '收起' : '展开'}<CaretDownIcon aria-hidden="true" /></button>}</div>
    <div className="journey-order-details" id={`transfer-order-${order.id}`} hidden={!finished && !expanded}>
      <TransferFields booking={order.booking} showTime={false} showPassenger={false} />
      <div className="journey-pickup-vehicle" aria-label="接驾车辆信息"><div><strong>{vehicle.plate} · {vehicle.color}</strong><span>{vehicle.model} · 商务7座</span></div><img src={vehicle.image} alt={`${vehicle.color}${vehicle.model}商务7座`} /></div>
    </div>
    <div className={`journey-order-actions${isDailyCharter(order.product) ? '' : ' transfer-order-actions'}`}>
      {isDailyCharter(order.product) && <button onClick={() => onOpen('transfer-itinerary', order.id)}><ReceiptIcon aria-hidden="true" />行程单</button>}
      <button disabled={order.phase !== 'paid'} onClick={() => onOpen('transfer-manage', order.id)}><CalendarCheckIcon aria-hidden="true" />改期/取消</button>
      <button onClick={() => onOpen('transfer-contact', order.id)}><PhoneIcon aria-hidden="true" />联系龙师傅</button>
    </div>
  </section>
}

export function TransferOrderDialog({ order, mode, onClose, dispatch }) {
  const dialogRef = useRef(null)
  const dateRef = useRef(null)
  const [dateOpen, setDateOpen] = useState(false)
  const [date, setDate] = useState(order.booking.date)
  const [time, setTime] = useState(order.booking.time)
  const [draft, setDraft] = useState({ date, time })
  const [error, setError] = useState('')
  const [cancelConfirm, setCancelConfirm] = useState(false)
  useEffect(() => {
    const previous = document.activeElement
    dialogRef.current?.focus()
    return () => { if (previous?.isConnected) previous.focus() }
  }, [])
  useEffect(() => { if (dateOpen) dateRef.current?.focus() }, [dateOpen])
  const closeDate = () => { setDateOpen(false); dialogRef.current?.querySelector('.journey-date-field')?.focus() }
  const trapKeys = event => {
    if (event.key === 'Escape') { event.stopPropagation(); dateOpen ? closeDate() : onClose(); return }
    if (event.key !== 'Tab') return
    const active = dateOpen ? dateRef.current : dialogRef.current
    const controls = [...active.querySelectorAll('button:not(:disabled), input, a[href], [tabindex="0"]')]
    const first = controls[0], last = controls.at(-1)
    if (event.shiftKey && (document.activeElement === first || document.activeElement === active)) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
  const title = mode === 'transfer-itinerary' ? '行程单' : mode === 'transfer-manage' ? '改期 / 取消' : '联系龙师傅'
  return <section className="journey-detail" role="dialog" aria-modal={!dateOpen} aria-label={title} ref={dialogRef} tabIndex={-1} onKeyDown={trapKeys}>
    <header className="journey-detail-nav" inert={dateOpen}><button aria-label="返回对话" onClick={onClose}><ArrowLeftIcon /></button><h2>{title}</h2><span /></header>
    <div className="journey-detail-body" inert={dateOpen}>
      {mode === 'transfer-itinerary' && <section className="journey-detail-section"><h1>按天包车行程单</h1><TransferFields booking={order.booking} /></section>}
      {mode === 'transfer-manage' && <section className="journey-detail-section"><h1>出行计划有变化？</h1><p>当前接送：{order.booking.date} {order.booking.time} · {order.booking.origin} → {order.booking.destination}</p>{order.phase === 'paid' ? <>
        <form className="journey-change-form" onSubmit={event => { event.preventDefault(); const issue = transferIssue({ ...order.booking, date, time }); if (issue) { setError(issue.text); return } dispatch({ type: 'TRANSFER_RESCHEDULE', id: order.id, date, time }); onClose() }}><h2>调整接送时间</h2>
          <button type="button" className="journey-date-field" aria-label="修改接送时间" aria-haspopup="dialog" aria-expanded={dateOpen} onClick={() => { setDraft({ date, time }); setDateOpen(true) }}><CalendarCheckIcon /><span>{date} {time}</span><CaretRightIcon /></button>
          <p>出发地、目的地和乘车信息保持不变。</p>{error && <p role="alert" className="journey-error">{error}</p>}<button className="journey-primary" disabled={date === order.booking.date && time === order.booking.time}>确认改期</button>
        </form>
        <div className="journey-cancel"><h2>取消本次预约</h2><p>取消后全额退款 <Price prefix="¥" value={order.amount.toLocaleString()} />。</p>{cancelConfirm ? <div className="journey-cancel-confirm"><strong>确定取消这次接送吗？</strong><button className="journey-danger" onClick={() => { dispatch({ type: 'TRANSFER_CANCEL', id: order.id }); onClose() }}>确认取消并退款</button><button onClick={() => setCancelConfirm(false)}>保留行程</button></div> : <button className="journey-danger" onClick={() => setCancelConfirm(true)}>申请取消订单</button>}</div>
      </> : <p>{order.refunded ? '此订单已取消，退款已完成。' : '订单已进入服务或完成阶段，如需调整，请联系龙师傅协商。'}</p>}</section>}
      {mode === 'transfer-contact' && <section className="journey-detail-section"><h1>龙师傅</h1><p>出发前我会按预约手机号提前联系您，请保持手机畅通。</p><TransferFields booking={order.booking} /><button className="journey-primary" onClick={onClose}>返回对话</button></section>}
    </div>
    {dateOpen && <div className="journey-payment-backdrop" onClick={event => { if (event.target === event.currentTarget) closeDate() }}><section className="journey-payment-sheet journey-date-sheet" role="dialog" aria-modal="true" aria-label="选择接送时间" tabIndex={-1} ref={dateRef}><div className="journey-sheet-handle" /><header><h2>选择接送时间</h2><button type="button" className="sheet-close" aria-label="关闭日期选择" onClick={closeDate}><XIcon /></button></header><MobileDatePicker minDate={localDay()} value={draft.date} showDuration={false} onChange={value => setDraft(current => ({ ...current, date: value }))} /><label className="transfer-order-time">接送时间<input type="time" value={draft.time} onInput={event => { const value = event.currentTarget.value; setDraft(current => ({ ...current, time: value })) }} /></label><button className="journey-primary" disabled={!draft.date || !draft.time} onClick={() => { setDate(draft.date); setTime(draft.time); setError(''); closeDate() }}>确定</button></section></div>}
  </section>
}
