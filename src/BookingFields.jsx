import { useState } from 'react'
import { CaretRightIcon } from '@phosphor-icons/react'
import { LocationPicker, TravelSheet, WheelColumn } from './TravelBooking'

export default function BookingFields({ booking, setBooking, capacity = 7, showDestination = true }) {
  const [locationField, setLocationField] = useState(null)
  const [peopleOpen, setPeopleOpen] = useState(false)
  const [peopleDraft, setPeopleDraft] = useState('1')
  const update = (key, value) => setBooking(current => ({ ...current, [key]: value }))
  return <>
    {[['origin', '出发地'], ...(showDestination ? [['destination', '目的地']] : [])].map(([key, label]) => <div className="booking-picker-field" key={key}>
      <span>{label}</span><button type="button" aria-label={`选择${label}`} aria-haspopup="dialog" className={`booking-picker-trigger${booking[key] ? '' : ' is-placeholder'}`} onClick={() => setLocationField(key)}><span>{booking[key] || `请选择${label}`}</span><CaretRightIcon /></button>
    </div>)}
    <div className="booking-picker-field"><span>出行人数</span><button type="button" className={`booking-picker-trigger${booking.passengers ? '' : ' is-placeholder'}`} aria-label="选择出行人数" aria-haspopup="dialog" onClick={() => { setPeopleDraft(booking.passengers || '1'); setPeopleOpen(true) }}><span>{booking.passengers ? `${booking.passengers}人` : '请选择人数'}</span><CaretRightIcon /></button></div>
    <label>乘车联络人<input required placeholder="请输入乘车联络人" value={booking.contact} onChange={event => update('contact', event.target.value)} /></label>
    <label>手机号<input type="tel" inputMode="tel" pattern="1[0-9]{10}" maxLength={11} required placeholder="请输入手机号" value={booking.phone} onChange={event => update('phone', event.target.value)} /></label>
    {locationField && <LocationPicker title={locationField === 'origin' ? '出发地' : '目的地'} value={booking[`${locationField}Place`] || null} onClose={() => setLocationField(null)} onConfirm={place => {
      setBooking(current => ({ ...current, [locationField]: [place.name, place.note].filter(Boolean).join(' · '), [`${locationField}Place`]: place })); setLocationField(null)
    }} />}
    {peopleOpen && <TravelSheet title="选择出行人数" onClose={() => setPeopleOpen(false)} className="departure-time-sheet">
      <div className="time-wheel passenger-wheel"><WheelColumn label="出行人数" options={Array.from({ length: capacity }, (_, index) => ({ value: String(index + 1), label: `${index + 1}人` }))} value={peopleDraft} onChange={setPeopleDraft} /><span className="time-wheel-selection" aria-hidden="true" /></div>
      <footer><button type="button" className="travel-primary" onClick={() => { update('passengers', peopleDraft); setPeopleOpen(false) }}>确定</button></footer>
    </TravelSheet>}
  </>
}
