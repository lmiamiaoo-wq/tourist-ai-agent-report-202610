import { localDay, transferIssue } from './transferConversation'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CaretRightIcon, XIcon } from '@phosphor-icons/react'
import MobileDatePicker from './MobileDatePicker'
import BookingFields from './BookingFields'
import { TravelSheet, WheelColumn } from './TravelBooking'

export default function TransferReservation({ booking, setBooking, onSubmit, container, reviewReady = false, onConsult }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ date: '', time: '' })
  const [timeOpen, setTimeOpen] = useState(false)
  const [timeDraft, setTimeDraft] = useState('09:00')
  const [error, setError] = useState('')
  const errorRef = useRef(null)
  useEffect(() => { if (error) { errorRef.current?.scrollIntoView({ block: 'center' }); errorRef.current?.focus({ preventScroll: true }) } }, [error])
  const sheet = useRef(null)
  const trigger = useRef(null)
  useEffect(() => { if (open) sheet.current?.focus() }, [open])
  const close = () => { setOpen(false); trigger.current?.focus() }
  const valid = draft.date && /^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)
  return <>
    <div className="charter-section-divider" />
    <section className="transfer-service-section"><h2>预约信息</h2>
      <form id="transfer-booking-form" className="family-booking-form" noValidate onSubmit={event => {
        event.preventDefault()
        if (!reviewReady) { onConsult?.(); return }
        const issue = transferIssue(booking)
        if (issue) { setError(issue.text); return }
        setError(''); onSubmit()
      }}>
        <div className="family-range-field"><span>预定时间</span><button ref={trigger} type="button" className={`journey-date-field${booking.date ? "" : " is-placeholder"}`} aria-label="修改用车日期和时间" aria-haspopup="dialog" aria-expanded={open} onClick={() => { setDraft({ date: booking.date, time: booking.time || '09:00' }); setOpen(true) }}><span>{booking.date ? `${booking.date} ${booking.time}` : '请选择用车日期和时间'}</span><CaretRightIcon /></button></div>
        <BookingFields booking={booking} setBooking={setBooking} capacity={6} />
        {error && <p ref={errorRef} tabIndex={-1} className="journey-error" role="alert">{error}</p>}
      </form>
    </section>
    {open && container && createPortal(<div className="journey-payment-backdrop transfer-date-backdrop" onClick={event => { if (event.target === event.currentTarget) close() }}>
      <section ref={sheet} tabIndex={-1} className="journey-payment-sheet journey-date-sheet journey-range-sheet" role="dialog" aria-modal="true" aria-label="选择用车时间" onKeyDown={event => { if (event.key === 'Escape') close() }}>
        <div className="journey-sheet-handle" /><header><h2>选择用车时间</h2><button type="button" className="sheet-close" aria-label="关闭选择用车时间" onClick={close}><XIcon /></button></header>
        <MobileDatePicker minDate={localDay()} value={draft.date} showDuration={false} onChange={date => setDraft(current => ({ ...current, date }))} />
        <div className="transfer-time-picker"><span>用车时间</span>
          <button type="button" className="journey-date-field transfer-time-trigger" aria-label="修改具体时间" aria-haspopup="dialog" aria-expanded={timeOpen} onClick={() => { setTimeDraft(draft.time); setTimeOpen(true) }}><span>{draft.time}</span><CaretRightIcon /></button>
        </div>
        <button type="button" className="journey-primary" disabled={!valid} onClick={() => { setBooking(current => ({ ...current, ...draft })); setError(''); close() }}>确定</button>
      </section>
    </div>, container)}
    {timeOpen && <TravelSheet title="选择具体时间" className="departure-time-sheet" onClose={() => setTimeOpen(false)}>
          <div className="time-wheel transfer-clock-wheel" aria-label="用车时间滚轮">
            <WheelColumn label="小时" options={Array.from({ length: 24 }, (_, i) => { const value = String(i).padStart(2, '0'); return { value, label: `${value}时` } })} value={timeDraft.split(':')[0]} onChange={hour => setTimeDraft(current => `${hour}:${current.split(':')[1]}`)} />
            <WheelColumn label="分钟" options={Array.from({ length: 60 }, (_, i) => { const value = String(i).padStart(2, '0'); return { value, label: `${value}分` } })} value={timeDraft.split(':')[1]} onChange={minute => setTimeDraft(current => `${current.split(':')[0]}:${minute}`)} />
            <span className="time-wheel-selection" aria-hidden="true" />
          </div>
      <footer><button type="button" className="travel-primary" onClick={() => { setDraft(current => ({ ...current, time: timeDraft })); setTimeOpen(false) }}>确定</button></footer>
    </TravelSheet>}
  </>
}
