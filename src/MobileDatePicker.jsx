import { useState } from 'react'
import { CalendarCheckIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { DEFAULT_START, isoDate, tripDayLabel, dateLabel } from './journeyFlow'

export default function MobileDatePicker({ value, onChange, rangeEnd, rangeMode = false, showDuration = true }) {
  const [month, setMonth] = useState(() => new Date(`${value || DEFAULT_START}T12:00:00`))
  const year = month.getFullYear(), monthIndex = month.getMonth()
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const days = new Date(year, monthIndex + 1, 0).getDate()
  const moveMonth = delta => setMonth(new Date(year, monthIndex + delta, 1, 12))
  return <section className="journey-mobile-calendar" aria-label={rangeMode ? "选择用车日期区间" : "选择出发日期"}>
    <header><button type="button" aria-label="上个月" disabled={year === 2026 && monthIndex === 8} onClick={() => moveMonth(-1)}><CaretLeftIcon /></button><strong>{year}年{monthIndex + 1}月</strong><button type="button" aria-label="下个月" onClick={() => moveMonth(1)}><CaretRightIcon /></button></header>
    <div className="journey-calendar-grid">{['日','一','二','三','四','五','六'].map(day => <span key={day}>{day}</span>)}
      {Array.from({ length: firstWeekday }, (_, i) => <span key={`empty-${i}`} />)}
      {Array.from({ length: days }, (_, i) => { const day = i + 1, date = isoDate(new Date(year, monthIndex, day, 12)); return <button key={date} type="button" disabled={date < DEFAULT_START} aria-label={`${year}年${monthIndex + 1}月${day}日`} className={rangeMode && rangeEnd && date > value && date < rangeEnd ? "in-range" : ""} aria-pressed={value === date || (rangeMode && rangeEnd === date)} onClick={() => onChange(date)}>{day}</button> })}
    </div><p className="journey-calendar-selected"><CalendarCheckIcon />{rangeMode ? `${value ? tripDayLabel(value) : "请选择开始日期"} — ${rangeEnd ? tripDayLabel(rangeEnd) : "请选择结束日期"}` : value ? (showDuration ? dateLabel(value) : tripDayLabel(value)) : "请选择日期"}{!rangeMode && showDuration && <span>3天2晚</span>}</p>
  </section>
}
