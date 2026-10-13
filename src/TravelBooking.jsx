import Price from './Price'
import { charterAmount, earliestDeparture, localDeparture, validDeparture } from './charterPricing'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeftIcon, CaretRightIcon, CheckIcon, CrosshairIcon, MagnifyingGlassIcon, MapPinIcon, MinusIcon, PlusIcon, XIcon } from '@phosphor-icons/react'

export const initialCharter = () => ({ type: '日包车', people: 2, days: 1, ...localDeparture(earliestDeparture()), origin: null, destination: null, contactName: '', phone: '', needs: '' })

export function TravelSheet({ title, onClose, children, className = '' }) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const previousFocus = document.activeElement
    const shell = document.querySelector('.app-shell')
    const wasInert = shell.inert
    shell.inert = true
    ref.current.querySelector('button')?.focus()
    return () => { shell.inert = wasInert; previousFocus?.focus() }
  }, [])
  const keydown = (event) => {
    if (event.key === 'Escape') { event.stopPropagation(); closeRef.current() }
    if (event.key !== 'Tab') return
    const items = [...ref.current.querySelectorAll('button:not(:disabled),a[href],input,textarea,select,[tabindex="0"]')].filter(e => e.getClientRects().length)
    const first = items[0], last = items.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  return createPortal(<div className="travel-sheet-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
    <section className={`travel-sheet ${className}`} ref={ref} role="dialog" aria-modal="true" aria-label={title} onKeyDown={keydown}>
      <header><h2>{title}</h2><button type="button" aria-label={`关闭${title}`} onClick={onClose}><XIcon /></button></header>
      {children}
    </section>
  </div>, document.body)
}

function Counter({ label, value, min = 1, step = 1, max, unit, onChange }) {
  return <div className="charter-form-row"><span>{label}</span><div className="mobile-counter"><button type="button" aria-label={`减少${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}><MinusIcon /></button><output>{value}<small>{unit}</small></output><button type="button" aria-label={`增加${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}><PlusIcon /></button></div></div>
}

const placeSuggestions = [
  { name: '贵阳北站', detail: '观山湖区 · 高铁出发层', lat: 26.6195, lng: 106.6744 },
  { name: '贵阳龙洞堡国际机场', detail: '南明区 · 航站楼出发层', lat: 26.5385, lng: 106.8007 },
  { name: '青岩古镇', detail: '花溪区 · 古镇游客中心', lat: 26.3302, lng: 106.6850 },
  { name: '黄果树景区', detail: '安顺市 · 景区游客中心', lat: 25.9917, lng: 105.6657 },
]

const padTime = value => String(value).padStart(2, '0')
const toLocalDate = date => `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())}`
const dateWheelOptions = minimum => Array.from({ length: 14 }, (_, index) => {
  const date = new Date(minimum)
  date.setDate(date.getDate() + index)
  const weekday = toLocalDate(date) === toLocalDate(new Date()) ? '今天' : date.toLocaleDateString('zh-CN', { weekday: 'short' })
  return { value: toLocalDate(date), label: `${padTime(date.getMonth() + 1)}月${padTime(date.getDate())}日 ${weekday}` }
})

export function WheelColumn({ label, options, value, onChange }) {
  const ref = useRef(null), timer = useRef(null), ready = useRef(false)
  const optionKey = options.map(option => option.value).join(',')
  useLayoutEffect(() => {
    ready.current = false
    const index = Math.max(0, options.findIndex(option => option.value === value))
    ref.current.scrollTop = index * 44
    const frame = requestAnimationFrame(() => { ready.current = true })
    return () => { cancelAnimationFrame(frame); clearTimeout(timer.current) }
  }, [value, optionKey])
  return <div className="time-wheel-column" ref={ref} role="listbox" aria-label={label} onScroll={event => {
    if (!ready.current) return
    const top = event.currentTarget.scrollTop
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const index = Math.max(0, Math.min(options.length - 1, Math.round(top / 44)))
      if (options[index]?.value !== value) onChange(options[index].value)
    }, 120)
  }}>
    {options.map(option => <button type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}
  </div>
}

function DepartureTimePicker({ date, time, onConfirm }) {
  const [open, setOpen] = useState(false)
  const [minimum, setMinimum] = useState(earliestDeparture)
  const [draft, setDraft] = useState(() => localDeparture(earliestDeparture()))
  const [pickerError, setPickerError] = useState('')
  useEffect(() => {
    if (!open) return
    const timer = setInterval(() => setMinimum(earliestDeparture()), 30000)
    return () => clearInterval(timer)
  }, [open])
  const floor = localDeparture(minimum)
  const safeDraft = new Date(`${draft.date}T${draft.time}`) < minimum ? floor : draft
  const [hour, minute] = safeDraft.time.split(':')
  const dates = dateWheelOptions(minimum)
  const hours = Array.from({ length: 24 }, (_, h) => ({ value: padTime(h), label: `${h}点` })).filter(option => safeDraft.date > floor.date || option.value >= floor.time.slice(0, 2))
  const minutes = Array.from({ length: 6 }, (_, index) => ({ value: padTime(index * 10), label: `${index * 10}分` })).filter(option => safeDraft.date > floor.date || hour > floor.time.slice(0, 2) || option.value >= floor.time.slice(3))
  const openPicker = () => {
    const earliest = earliestDeparture()
    const chosen = new Date(`${date}T${time}`)
    setMinimum(earliest)
    setDraft(Number.isFinite(chosen.getTime()) && chosen >= earliest ? {date,time} : localDeparture(earliest))
    setPickerError('')
    setOpen(true)
  }
  return <>
    <button className="charter-time-trigger" type="button" onClick={openPicker}>
      <span>出行时间</span><strong className={date ? 'has-value' : ''}>{date ? `${date.slice(5).replace('-', '月')}日 ${time}` : '请选择'}</strong><CaretRightIcon />
    </button>
    {open && <TravelSheet title="选择出发时间" onClose={() => setOpen(false)} className="departure-time-sheet">
      <p className="departure-help">至少提前12小时预约 · 最早 {floor.date.slice(5).replace('-', '月')}日 {floor.time}</p>
      <div className="time-wheel" aria-label="出发时间滚轮">
        <WheelColumn label="日期" options={dates} value={safeDraft.date} onChange={date => setDraft({...safeDraft,date})} />
        <WheelColumn label="小时" options={hours} value={hour} onChange={hour => setDraft({...safeDraft,time:`${hour}:${minute}`})} />
        <WheelColumn label="分钟" options={minutes} value={minute} onChange={minute => setDraft({...safeDraft,time:`${hour}:${minute}`})} />
        <span className="time-wheel-selection" aria-hidden="true" />
      </div>
      {pickerError && <p role="alert" className="form-error">{pickerError}</p>}
      <footer><button className="travel-primary" type="button" onClick={() => {
        if (!validDeparture(safeDraft.date, safeDraft.time)) { setMinimum(earliestDeparture()); setPickerError('最早出发时间已更新，请确认新的时间'); return }
        onConfirm(safeDraft.date, safeDraft.time); setOpen(false)
      }}>确认</button></footer>
    </TravelSheet>}
  </>
}

export function LocationPicker({ title, value, onClose, onConfirm }) {
  const host = useRef(null), map = useRef(null), movingToSelection = useRef(false)
  const [selected, setSelected] = useState(value)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const choose = (place) => {
    setSelected(place)
    movingToSelection.current = true
    map.current?.setView([place.lat, place.lng], 11, { animate: true })
  }
  useEffect(() => {
    const bounds = [[25.5, 105.3], [27.1, 107.25]]
    map.current = L.map(host.current, { minZoom: 8, maxZoom: 12, zoomControl: false, attributionControl: false, maxBounds: bounds, maxBoundsViscosity: 1 }).setView(value ? [value.lat, value.lng] : [26.35, 106.3], value ? 11 : 8)
    L.imageOverlay('/assets/charter-map.svg', bounds).addTo(map.current)
    map.current.on('click', event => choose({ name: '地图选点', detail: `${event.latlng.lat.toFixed(5)}, ${event.latlng.lng.toFixed(5)}`, lat: event.latlng.lat, lng: event.latlng.lng }))
    map.current.on('moveend', () => {
      if (movingToSelection.current) { movingToSelection.current = false; return }
      const center = map.current.getCenter()
      setSelected({ name: '地图中心位置', detail: '拖动地图选择的地点', lat: center.lat, lng: center.lng })
    })
    return () => { map.current.remove() }
  }, [])
  const search = (event) => {
    event.preventDefault()
    if (!query.trim()) return
    const places = placeSuggestions.filter(place => place.name.includes(query.trim()))
    setResults(places)
    setError(places.length ? '' : '未找到匹配地点，可直接在地图选点并补充地点名称。')
  }
  return <TravelSheet title={`选择${title}`} onClose={onClose} className="location-sheet">
    <div className="location-map-stage">
      <div ref={host} className="location-map-live" aria-label="地点地图，可拖动地图移动选点" />
      <span className="location-center-pin" aria-hidden="true"><MapPinIcon weight="fill" /></span>
      <button className="location-recenter" type="button" aria-label="回到当前选点" onClick={() => choose(selected || value || placeSuggestions[0])}><CrosshairIcon /></button>
    </div>
    <form className="place-search" onSubmit={search}><MagnifyingGlassIcon aria-hidden="true" /><input aria-label="搜索地点" placeholder="搜索地点" value={query} onChange={e=>setQuery(e.target.value)} /><button disabled={!query.trim()}>搜索</button></form>
    <div className="place-options">
      {error && <p role="status" className="field-help">{error}</p>}
      <div className="place-results">{(results.length ? results : placeSuggestions).map(place => { const active = selected?.name === place.name; return <button className={active ? 'selected' : ''} type="button" key={`${place.lat}-${place.lng}`} onClick={() => choose(place)}><span><strong>{place.name}</strong><small>{place.detail}</small></span>{active && <CheckIcon weight="bold" />}</button> })}</div>
      {selected && <div className="selected-place"><strong>{selected.name}</strong><small>{selected.detail || `${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`}</small><input aria-label="地点补充说明" placeholder="补充上车点、门牌或入口（选填）" value={selected.note || ''} onChange={e => setSelected({ ...selected, note: e.target.value })} /></div>}
    </div>
    <footer><button className="travel-primary" disabled={!selected} onClick={() => onConfirm(selected)}>确认{title}</button></footer>
  </TravelSheet>
}

export function CharterForm({ value, onChange, onSubmit }) {
  const [locationField, setLocationField] = useState(null)
  const [error, setError] = useState('')
  const hasRequiredDetails = Boolean(value.date && value.time && value.origin && value.destination)
  const update = (key, next) => { onChange({ ...value, [key]: next }); setError('') }
  const submit = event => {
    event.preventDefault()
    if (!value.date || !value.time) { setError('请选择出行日期和具体时间'); return }
    if (!validDeparture(value.date, value.time)) { setError('请至少提前12小时预约，重新选择出行时间'); return }
    if (value.type === '日包车' && (value.days < 0.5 || value.days > 30 || !Number.isInteger(value.days * 2))) { setError('包车天数需为0.5天的倍数，最多30天'); return }
    if (!value.origin || !value.destination) { setError('请在地图中选择出发地和目的地'); return }
    if (Math.abs(value.origin.lat-value.destination.lat)<.0001 && Math.abs(value.origin.lng-value.destination.lng)<.0001) { setError('出发地与目的地不能相同'); return }
    if (!value.contactName?.trim()) { setError('请输入乘车联络人'); return }
    if (!/^1[3-9]\d{9}$/.test(value.phone?.trim() || '')) { setError('请输入正确的11位手机号'); return }
    onSubmit(value)
  }
  return <section className="default-charter" aria-labelledby="charter-title">
    <div className="charter-section-heading"><h2 id="charter-title">预约包车</h2></div>
    <form className="default-charter-card" onSubmit={submit}>
      <div className="charter-type" aria-label="包车类型">{['日包车','定点接送'].map(type => <button key={type} type="button" aria-pressed={value.type===type} onClick={() => update('type',type)}>{type}</button>)}</div>
      <div className="charter-counters"><Counter label="包车人数" value={value.people} max={30} unit="人" onChange={n=>update('people',n)} />
      {value.type === '日包车' && <Counter label="包车天数" min={0.5} step={0.5} value={value.days} max={30} unit="天" onChange={n=>update('days',n)} />}</div>
      <div className="charter-datetime"><DepartureTimePicker date={value.date} time={value.time} onConfirm={(date, time) => { onChange({ ...value, date, time }); setError('') }} /></div>
      {['origin','destination'].map((key,index) => <button className="charter-location" type="button" key={key} onClick={()=>setLocationField(key)}><span>{index ? '目的地' : '出发地'}</span><strong className={value[key] ? 'has-value' : ''}>{value[key] ? `${value[key].name}${value[key].note ? ' · '+value[key].note : ''}` : index ? '去哪里' : '从哪里出发'}</strong><CaretRightIcon /></button>)}
      <div className="charter-contact-fields">
        <label><span>乘车联络人</span><input type="text" autoComplete="name" maxLength={20} value={value.contactName || ''} onChange={e=>update('contactName',e.target.value)} placeholder="请输入姓名" /></label>
        <label><span>手机号</span><input type="tel" inputMode="tel" autoComplete="tel" maxLength={11} value={value.phone || ''} onChange={e=>update('phone',e.target.value)} placeholder="请输入11位手机号" /></label>
      </div>
      <label className="charter-needs"><span>更多需求<small>（选填）</small></span><textarea rows={1} maxLength={200} value={value.needs || ''} onChange={e=>update('needs',e.target.value)} placeholder="如两大一小、帮忙提下行李" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="charter-action-row">
        <div className="charter-amount" aria-live="polite"><span>预估费用</span><strong><Price value={(hasRequiredDetails ? charterAmount(value) : 0).toLocaleString("zh-CN")} prefix="¥" /></strong></div>
        <button className="travel-primary" type="submit">预定包车服务</button>
      </div>
    </form>
    {locationField && <LocationPicker title={locationField==='origin'?'出发地':'目的地'} value={value[locationField]} onClose={()=>setLocationField(null)} onConfirm={place=>{update(locationField,place);setLocationField(null)}} />}
  </section>
}

export function ContactSheet({ onClose, context }) {
  const [state, setState] = useState('ready')
  useEffect(() => {
    if (state !== 'calling') return
    const timer = window.setTimeout(() => setState('connected'), 1200)
    return () => window.clearTimeout(timer)
  }, [state])
  return <TravelSheet title="联系司机" onClose={onClose}>
    <div className="contact-sheet-content"><img className="contact-avatar" src="/assets/yang-tonghai-avatar.png" alt="龙师傅" /><h3>龙师傅 · 专属司机</h3>{context && <p>{context}</p>}
      <p aria-live="polite">{({ready:'联系司机，沟通出行安排',calling:'正在呼叫…',connected:'通话中',ended:'通话已结束'})[state]}</p>
      <button className="travel-primary" onClick={() => setState(state==='calling' || state==='connected' ? 'ended' : 'calling')}>{state==='calling' || state==='connected' ? '挂断' : '拨打电话'}</button>
    </div>
  </TravelSheet>
}

export function Storefront({ products, onClose, onOpen, inactive, profileCard, backgroundImage, backgroundAlt, guideName = '龙师傅', backLabel = '返回对话' }) {
  const [filter, setFilter] = useState('服务')
  const [profileScrolled, setProfileScrolled] = useState(false)
  const visible = products.filter(product => filter === '服务' ? !!product.charter : !product.charter)
  return <><section className={`driver-store driver-profile-page${profileScrolled ? ' profile-scrolled' : ''}`} inert={inactive} aria-label={`${guideName}个人主页`} onScroll={event => setProfileScrolled(event.currentTarget.scrollTop > 0)}>
    <header className="profile-topbar"><button className="store-back" onClick={onClose} aria-label={backLabel}><ArrowLeftIcon /></button><strong>{guideName}的主页</strong></header>
    <div className="hero"><img className="hero-image" src={backgroundImage} alt={backgroundAlt} /><div className="hero-scrim" /></div>
    <div className="content-flow">{profileCard}</div>
    <div className="store-content">
      <nav className="store-filters" role="tablist" aria-label="橱窗分类">{['服务','商品'].map(item=><button key={item} role="tab" aria-selected={item===filter} aria-pressed={item===filter} onClick={()=>setFilter(item)}>{item}</button>)}</nav>
      <div className="store-products">{visible.map(product=><button className={`store-product ${product.charter ? 'store-product-charter' : 'store-product-route'}`} key={product.id} onClick={()=>onOpen(product)}><img src={product.image} alt={product.name}/><span><strong>{product.cardName || product.name}</strong><p>{product.cardDescription || product.intro}</p>{(product.referencePrice || product.priceLabel || product.price) && <b>{product.referencePrice ? <Price value={product.referencePrice} prefix="参考价 ￥" auxiliaryWeight={400} /> : <Price value={product.price || product.priceLabel?.replace(/^[￥¥]/, "")} suffix={product.priceSuffix || (!product.priceLabel ? `/${product.unit}` : "")} auxiliaryWeight={400} />}</b>}</span></button>)}</div>
    </div>
  </section></>
}
