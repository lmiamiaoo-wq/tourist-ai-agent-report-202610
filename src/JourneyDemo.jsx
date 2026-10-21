import { isDailyCharter, charterInputDraft, charterAmount, charterIssues } from './charterConversation'
import JourneyReview, { reviewOptions } from './JourneyReview'
import { TransferOrderCard, TransferOrderDialog } from './TransferOrder'
import { hasPendingTransfer, transferAutoPhases, transferOrderFinished } from './transferOrders'
import { transferInputDraft, transferKey } from './transferConversation'
import Price from './Price'
import MobileDatePicker from './MobileDatePicker'
import BookingFields from './BookingFields'
import GuideServices from './GuideServices'
import { charterPlanTitle, familyTitle, familyDays, charterTitle, charterDescription, charterSections } from './familyTrip'
import ConversationComposer from './ConversationComposer'
import { useEffect, useImperativeHandle, useReducer, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CarProfileIcon, TrainIcon, BedIcon, MountainsIcon, ForkKnifeIcon, MusicNotesIcon, XIcon, MinusIcon, PlusIcon, ArrowUpRightIcon, ArrowLeftIcon, CalendarCheckIcon, CheckCircleIcon, MapPinIcon, PhoneIcon, ReceiptIcon, CaretLeftIcon, CaretRightIcon, CaretDownIcon } from '@phosphor-icons/react'
import { autoPhases, charterDateLabel, dateLabel, initialJourney, INTENTION, journeyReducer, quickActionsVisible, plans, PUSH_DELAY, DEFAULT_START, tripDayLabel, tripDate, isoDate, vehicle } from './journeyFlow'
import './journey.css'


function DepartureServices({ currentService, services, dailyService, onOpen }) {
  const offers = currentService === 'transfer' ? [dailyService, ...services.filter(service => !service.charter)].filter(Boolean) : services
  return <section className="journey-other-services" aria-label="出发后的服务推荐">
    <article className="chat-message assistant"><p>{currentService === 'transfer' ? '如果还想在贵州多玩几天，我这边也有按天包车和7天6晚环线，您可以先看看。' : '之后去车站、机场或景区，也可以找我定点接送。我这边还有7天6晚环线，您可以先看看。'}</p></article>
    <GuideServices services={offers} onOpen={onOpen} />
  </section>
}

const activityIcons = { '交通': CarProfileIcon, '高铁': TrainIcon, '住宿': BedIcon, '景点/场馆': MountainsIcon, '餐饮': ForkKnifeIcon, '音乐节': MusicNotesIcon }
function TripDays({ start = DEFAULT_START, days = familyDays, dateOffset = 0 }) {
  return <div className="plan-day-list">{days.map((day, index) => <article className="plan-day-card" key={day.title}>
    <header><div className="plan-day-heading"><span className="plan-day-badge">D{index + 1}</span><h3>{tripDayLabel(start, index + dateOffset)}</h3></div></header>
    <h3>{day.title}</h3>
    <ol className="plan-timeline">{day.stops.map(stop => { const Icon = activityIcons[stop.type] || MapPinIcon; return <li className="plan-timeline-item" key={stop.time}>
      <span className="plan-timeline-icon" aria-hidden="true"><Icon /></span>
      <div className="plan-timeline-content"><h4><time>{stop.time}</time><span> · </span>{stop.type}</h4>{stop.details.map(detail => <p key={detail}>{detail}</p>)}</div>
    </li> })}</ol>
    {day.hotel && <p><strong>住宿：</strong>{day.hotel}</p>}
    {day.service && <p className="plan-day-service-note">{day.service}</p>}
  </article>)}</div>
}

function PlanOverview({ start = DEFAULT_START, passengers = 4 }) {
  return <>
    <section className="plan-introduction"><h1>{familyTitle.replaceAll("|", " · ")}</h1><p className="plan-author">龙师傅 · 贵旅出行</p><p>{dateLabel(start)} · 一家{passengers}口 · 商务7座</p></section>
    <section className="plan-section"><h2><CalendarCheckIcon />行程安排</h2><TripDays start={start} /></section>
  </>
}
function ItineraryOverview({ start, passengers = 4 }) {
  return <>
    <section className="plan-introduction"><h1>{charterPlanTitle}</h1><p className="plan-author">龙师傅 · 贵旅出行</p><p>{charterDateLabel(start)} · 一家{passengers}口 · 商务7座</p></section>
    <section className="plan-section"><h2><CalendarCheckIcon />行程安排</h2><TripDays start={start} days={familyDays.slice(1)} dateOffset={1} /></section>
  </>
}
function CharterOverview({ booking, setBooking, onOpenRange, rangeOpen, serviceOnly = false, showRoute = false }) {
  return <>
    <img className="charter-service-cover" src="/assets/charter-mountain-road.png" alt="白色商务车行驶在山水公路上" />
    <section className="journey-detail-section charter-service-intro"><p className="charter-service-price"><Price value="900" prefix="¥" suffix=" / 天" suffixSize={12} /></p><h1>按天包车</h1></section>
    <div className="charter-section-divider" />
    <section className="journey-detail-section"><h2>服务描述</h2><p>{charterTitle}</p><p>{charterDescription}</p></section>
    {charterSections.map(([title, items]) => <section className="journey-detail-section family-service-section" key={title}><h2>{title}</h2><ul>{items.map(item => <li key={item}>{item}</li>)}</ul></section>)}
    {!serviceOnly && <><div className="charter-section-divider" />
    <section className="journey-detail-section"><h2>预约信息</h2><p>商务7座 · 1台 · {tripDayLabel(booking.pickupAt.slice(0, 10))}—{tripDayLabel(booking.returnAt.slice(0, 10))}</p>
      {showRoute && <p>行程路线：{booking.destination}</p>}
      <form id="family-booking-form" className="family-booking-form" onSubmit={event => { event.preventDefault(); booking.onSubmit() }}>
        <div className="family-range-field"><span>预定时间</span><button type="button" className="journey-date-field" aria-label="修改用车日期区间" aria-haspopup="dialog" aria-expanded={rangeOpen} onClick={onOpenRange}><span>{booking.pickupAt.slice(0, 10)} 至 {booking.returnAt.slice(0, 10)}</span><CaretRightIcon /></button></div>
        <BookingFields booking={booking} setBooking={setBooking} showDestination={false} />
      </form>
    </section></>}
  </>
}

export default function JourneyDemo({ ref, backLabel = '返回对话', hidden = false, appRef, homeRef, suspended, onModalChange, services = [], dailyService, onOpenService, onCharterConsult, onOpenTransfer, onTransferBookingChange, onTransferSubmissionsChange }) {
  const [state, dispatch] = useReducer(journeyReducer, undefined, initialJourney)
  useEffect(() => { if (state.transfer?.booking && !isDailyCharter(state.transfer.product)) onTransferBookingChange?.(state.transfer.booking) }, [state.transfer?.booking, onTransferBookingChange])
  useEffect(() => { if (state.transferSubmissions) onTransferSubmissionsChange?.(state.transferSubmissions) }, [state.transferSubmissions, onTransferSubmissionsChange])
  const [selectedTransferId, setSelectedTransferId] = useState(null)
  const selectedTransferOrder = state.transferOrders?.find(order => order.id === selectedTransferId)
  const [input, setInput] = useState('')
  useEffect(() => { if (input.trim()) dispatch({ type: 'DISMISS_QUICK_ACTIONS' }) }, [input])
  const [modal, setModal] = useState(null)
  const [freshCharterInquiry, setFreshCharterInquiry] = useState(false)
  const [inquiryBooking, setInquiryBooking] = useState(null)
  const [charterServiceOnly, setCharterServiceOnly] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const paymentRef = useRef(null)
  const [target, setTarget] = useState(null)
  const [chosen, setChosen] = useState(plans[0])
  useImperativeHandle(ref, () => ({ openCharter(fresh = false) { setFreshCharterInquiry(fresh); setInquiryBooking(null); setCharterServiceOnly(true); setChosen(plans[0]); setModal('charter') }, startTransfer(product, booking, fresh = false) { setModal(null); setInput(''); dispatch({ type: 'TRANSFER_START', product, booking, fresh }) }, reviewCharter(product, draft) { setCharterServiceOnly(false); setInquiryBooking({ ...draft }); setInquiryFormBooking({ ...draft, pickupAt: `${draft.date}T${draft.time}`, returnAt: `${draft.endDate}T18:30` }); dispatch({ type: 'TRANSFER_REVIEW', product, booking: draft }); setModal('charter') }, reviewTransfer(product, booking) { dispatch({ type: 'TRANSFER_REVIEW', product, booking }) }, submitTransfer(booking) { dispatch({ type: 'TRANSFER_SUBMIT', booking, number: `TF${Date.now()}` }) } }), [])
  const [inquiryFormBooking, setInquiryFormBooking] = useState(null)
  const [familyBooking, setFamilyBooking] = useState({ pickupAt: '2026-09-25T10:56', returnAt: '2026-09-26T18:30', origin: '贵阳北站网约车接送区', destination: '贵阳北站', passengers: '4', contact: '林晓月', phone: '13800000000' })
  const booking = inquiryBooking ? inquiryFormBooking : familyBooking
  const setBooking = inquiryBooking ? setInquiryFormBooking : setFamilyBooking
  const [orderExpanded, setOrderExpanded] = useState(false)
  const [changeDate, setChangeDate] = useState(DEFAULT_START)
  const [dateOpen, setDateOpen] = useState(false)
  const [dateDraft, setDateDraft] = useState(DEFAULT_START)
  const [rangeDraft, setRangeDraft] = useState({ start: '2026-09-25', end: '2026-09-26', startTime: '10:56', endTime: '18:30' })
  const [rangeEdge, setRangeEdge] = useState('start')
  const rangeValid = !!rangeDraft.start && !!rangeDraft.end && rangeDraft.end >= rangeDraft.start
  const openRange = () => {
    setRangeDraft({ start: booking.pickupAt.slice(0, 10), end: booking.returnAt.slice(0, 10), startTime: booking.pickupAt.slice(11), endTime: booking.returnAt.slice(11) })
    setRangeEdge('start'); setDateOpen(true)
  }
  const pickRangeDate = date => {
    if (rangeEdge === 'start') { setRangeDraft(d => ({ ...d, start: date, end: '' })); setRangeEdge('end') }
    else if (date < rangeDraft.start) { setRangeDraft(d => ({ ...d, start: date, end: '' })); setRangeEdge('end') }
    else { setRangeDraft(d => ({ ...d, end: date })); setRangeEdge('start') }
  }
  const dateRef = useRef(null)
  useEffect(() => {
    if (!dateOpen) return
    const previous = document.activeElement
    dateRef.current?.focus()
    return () => { if (previous?.isConnected) previous.focus() }
  }, [dateOpen])
  const [changeError, setChangeError] = useState('')
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const latestRef = useRef(null)
  const pinnedRef = useRef(null)
  const dialogRef = useRef(null)
  const composerRef = useRef(null)
  const transferService = services.find(service => service.charter)
  const order = state.order
  const orderPlan = plans.find(plan => plan.id === order?.planId)
  const paused = suspended || !!modal
  const pendingTransfer = hasPendingTransfer(state)
  const transferAutoOrder = state.transferOrders?.find(order => transferAutoPhases.includes(order.phase))
  const isAuto = !state.transfer?.active && !pendingTransfer && autoPhases.includes(state.phase)

  useEffect(() => setTarget(appRef.current), [appRef])
  useEffect(() => { onModalChange(!!modal); return () => onModalChange(false) }, [modal, onModalChange])
  useEffect(() => {
    if (!isAuto || paused) return
    const timer = window.setTimeout(() => dispatch({ type: 'ADVANCE' }), PUSH_DELAY)
    return () => window.clearTimeout(timer)
  }, [state.phase, state.messages.length, isAuto, paused])
  useEffect(() => {
    if (!transferAutoOrder || paused || state.transfer?.active) return
    const timer = window.setTimeout(() => dispatch({ type: 'TRANSFER_ADVANCE', id: transferAutoOrder.id }), PUSH_DELAY)
    return () => window.clearTimeout(timer)
  }, [transferAutoOrder, paused, state.transfer?.active])
  const lastScrollVersion = useRef(`${state.messages.length}:${state.phase}`)
  useEffect(() => {
    if (suspended) return
    const version = `${state.messages.length}:${state.phase}`
    if (lastScrollVersion.current === version) return
    lastScrollVersion.current = version
    if (state.messages.length < 2) return
    const frame = requestAnimationFrame(() => {
      const home = homeRef.current
      const last = latestRef.current
      if (!home || !last) return
      const inputRow = composerRef.current?.querySelector('.input-row')
      if (!inputRow) return
      home.scrollTo({ top: home.scrollHeight, behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [state.messages.length, state.phase, homeRef, suspended])
  useEffect(() => {
    if (!modal) return
    const previous = document.activeElement
    if (!modal.startsWith('transfer-')) dialogRef.current?.focus()
    return () => { if (previous?.isConnected) previous.focus() }
  }, [modal])

  useEffect(() => {
    if (!paymentOpen) return
    const previous = document.activeElement
    paymentRef.current?.focus()
    return () => { if (previous?.isConnected) previous.focus() }
  }, [paymentOpen])

  const close = () => { setDateOpen(false); setPaymentOpen(false); setModal(null); setCancelConfirm(false); setChangeError('') }
  const send = event => {
    event.preventDefault()
    if (input.trim()) { dispatch({ type: state.transfer?.active ? 'TRANSFER_SEND' : state.consultRequested ? 'CONSULT_REPLY' : 'SEND', text: input }); setInput('') }
  }
  const openPlan = plan => { setChosen(plan); setModal('detail') }
  const currentInquiry = inquiryBooking && { ...inquiryBooking, ...booking, date: booking.pickupAt.slice(0, 10), time: booking.pickupAt.slice(11), endDate: booking.returnAt.slice(0, 10) }
  const inquirySubmitted = currentInquiry && state.transferSubmissions?.includes(transferKey(currentInquiry))
  const currentAmount = currentInquiry ? charterAmount(currentInquiry) : chosen.price
  const pay = () => {
    if (currentInquiry) {
      if (charterIssues(currentInquiry).length || inquirySubmitted) return
      dispatch({ type: 'TRANSFER_SUBMIT', booking: currentInquiry, number: `CH${Date.now()}` }); close(); return
    }
    dispatch({ type: 'BOOK_SERVICE' })
    dispatch({ type: 'PAY', planId: chosen.id, number: `LG20260924${String(Date.now()).slice(-6)}`, booking: { ...booking, start: isoDate(tripDate(booking.pickupAt.slice(0, 10), -1)) } })
    close()
  }
  const manage = () => { setChangeDate(order.start); setChangeError(''); setCancelConfirm(false); setModal('manage') }
  const saveDate = event => {
    event.preventDefault()
    if (!changeDate || changeDate < DEFAULT_START) { setChangeError('请选择可预约的出发日期。'); return }
    dispatch({ type: 'RESCHEDULE', start: changeDate }); close()
  }

  const trapKeys = event => {
    if (event.key === 'Escape') { event.stopPropagation(); dateOpen ? setDateOpen(false) : paymentOpen ? setPaymentOpen(false) : close(); return }
    if (event.key !== 'Tab') return
    const activeDialog = dateOpen ? dateRef.current : paymentOpen ? paymentRef.current : dialogRef.current
    const controls = [...activeDialog.querySelectorAll('button:not(:disabled), input, select, textarea, [tabindex="0"]')]
    const first = controls[0], last = controls.at(-1)
    if (event.shiftKey && (document.activeElement === first || document.activeElement === activeDialog)) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }

  const openTransferOrder = (mode, id) => { setSelectedTransferId(id); setModal(mode) }
  const tripFinished = ['review', 'thanks', 'lost-question', 'lost-confirmation', 'lost-acknowledgement', 'done', 'cancelled'].includes(state.phase)
  const orderCard = order && <section ref={pinnedRef} className={`journey-order${tripFinished ? ' journey-order-history' : ''}`} aria-label={tripFinished ? '行程订单' : '置顶订单'}>
        <div className="journey-order-summary"><strong>{charterPlanTitle}</strong><span className={`journey-pinned-status${order.refunded ? ' muted' : ''}`}>{order.status}</span></div>
        <div className="journey-order-meta"><p>{charterDateLabel(order.start)}</p>{!tripFinished && <button className="journey-order-toggle" type="button" aria-expanded={orderExpanded} aria-controls="journey-order-details" onClick={() => setOrderExpanded(value => !value)}>{orderExpanded ? '收起' : '展开'}<CaretDownIcon aria-hidden="true" /></button>}</div>
        <div id="journey-order-details" className="journey-order-details" hidden={!tripFinished && !orderExpanded}>
          <h4>行程线路</h4>
          <p className="journey-service-route">贵阳北站 → 红枫湖 → 青岩古镇 → 贵阳北站</p>
          <div className="journey-pickup-vehicle" aria-label="接驾车辆信息"><div><strong>{vehicle.plate} · {vehicle.color}</strong><span>{vehicle.model} · 商务7座</span></div><img src={vehicle.image} alt={`${vehicle.color}${vehicle.model}商务7座`} /></div>
        </div>
        <div className="journey-order-actions">
          <button onClick={() => { setModal('itinerary') }}><ReceiptIcon aria-hidden="true" />行程单</button>
          <button onClick={manage} disabled={state.phase !== 'paid'}><CalendarCheckIcon aria-hidden="true" />改期/取消</button>
          <button><PhoneIcon aria-hidden="true" />联系龙师傅</button>
        </div>
      </section>

  return <>
    <section className="journey-chat charter-chat" aria-label="与龙师傅的出行对话">
      {!tripFinished && orderCard}
      {(state.transferOrders || []).filter(order => !transferOrderFinished(order)).map(order => <TransferOrderCard key={order.id} order={order} onOpen={openTransferOrder} />)}
      <div className="chat-messages" role="log" aria-live="polite" aria-relevant="additions">
        {state.messages.map((message, index) => <div className="journey-message-wrap" key={index} ref={index === state.messages.length - 1 ? latestRef : null}>
          {message.type === 'transfer-recommendation' ? <section className="journey-other-services" aria-label="司机服务推荐"><article className="chat-message assistant"><p>{message.text}</p></article>{transferService && <button type="button" className="journey-service-product" aria-label="咨询或预约定点接送" onClick={() => onOpenService(transferService)}><img src={transferService.image} alt="" /><span><strong>{transferService.name}</strong><small>{transferService.cardDescription || transferService.intro}</small><b><Price value={transferService.price} suffix={transferService.priceSuffix} auxiliaryWeight={400} /></b></span></button>}</section> : message.type === 'transfer-order' ? (() => { const order = state.transferOrders?.find(item => item.id === message.orderId); return order && transferOrderFinished(order) ? <TransferOrderCard order={order} onOpen={openTransferOrder} /> : null })() : message.type === 'transfer-review' ? (() => { const order = state.transferOrders?.find(item => item.id === message.orderId); return order ? <JourneyReview order={order} enabled={order.phase === 'review'} onSubmit={review => dispatch({ type: 'TRANSFER_RATE', id: order.id, ...review })} /> : null })() : message.type === 'transfer-service' ? <button type="button" className="journey-service-product" aria-label={`查看本次咨询的${message.product.name}服务`} onClick={() => onOpenService(message.product)}><img src={message.product.image} alt="" /><span><strong>{message.product.name}</strong><small>{message.product.cardDescription || message.product.intro}</small><b><Price value={message.product.price} suffix={message.product.priceSuffix} auxiliaryWeight={400} /></b></span></button> : message.type === 'transfer-ready' ? <button type="button" className="journey-service-product" aria-label={`查看${isDailyCharter(message.product) ? '按天包车' : '定点接送'}并确认预约`} onClick={() => onOpenTransfer(message.product, message.booking)}><img src={message.product.image} alt="" /><span><strong>{message.product.name}</strong><small>{message.product.cardDescription || message.product.intro}</small><b><Price value={isDailyCharter(message.product) ? charterAmount(message.booking) : message.product.price} suffix={isDailyCharter(message.product) ? '' : '起'} auxiliaryWeight={400} /></b></span></button> : message.type === 'plans' ? <section className="journey-plans" aria-label="家庭游包车方案">
            <article className="chat-message assistant journey-plan-intro"><p>我给您一家四口安排了3天2晚：第一天到大方逛奢香古镇、听大地指纹音乐节，住云里芳香酒店；第二天坐高铁到贵阳，我接您去红枫湖露营，晚上送回阿云朵仓珍珀酒店；第三天逛青岩、吃状元蹄喝咖啡，最后送到贵阳北站。贵阳两天用商务7座包车，每天900元，共1800元，点开卡片看看详细安排。</p></article>
            <button className="journey-service-product journey-family-plan" onClick={() => openPlan(plans[0])} aria-label="查看3天2晚家庭游包车方案">
              <img src="/assets/sunlit-mountain-lake-hero.png" alt="红枫湖行程山水示意" />
              <span><strong title={familyTitle}>{familyTitle}</strong><small>一家4口 · 商务7座 · 贵阳2天包车接送</small><b><Price value="1800" prefix="¥" /></b></span>
            </button>
            {quickActionsVisible(state, index, input) && <div className="journey-quick-actions"><button className="journey-price-reply" onClick={() => dispatch({ type: 'BOOK' })}>方案不错，预定接送<ArrowUpRightIcon /></button><button className="journey-price-reply" disabled={state.consultRequested} onClick={() => dispatch({ type: 'CONSULT' })}>约龙师傅电话咨询<ArrowUpRightIcon /></button></div>}
          </section> : message.type === 'booking' ? <section className="journey-plans" aria-label="按天包车预约">
            <article className="chat-message assistant"><p>好的，贵阳这两天的接送交给我。商务7座，1台2天共1800元。预约信息已填好，您确认一下。</p></article>
            <button className="journey-service-product" onClick={() => { setInquiryBooking(null); setCharterServiceOnly(false); setModal('charter') }} aria-label="查看按天包车并确认预约"><img src="/assets/charter-mountain-road.png" alt="白色商务车" /><span><strong>按天包车</strong><small>{charterTitle}</small><b><Price value="1800" auxiliaryWeight={400} /></b></span></button>
          </section> : message.type === 'notice' ? (message.eta ? <><article className="chat-message assistant journey-departure-copy"><p>{message.text?.replace('已经和龙师傅确认过了，', '')}</p></article><DepartureServices currentService="charter" services={services} dailyService={dailyService} onOpen={onOpenService} /></> : null) : message.type === 'review' ? <JourneyReview order={order} enabled={state.phase === 'review'} onSubmit={review => dispatch({ type: 'REVIEW', ...review })} /> : <>
            <article className={`chat-message ${message.role}`}>{message.rating && <div className="journey-rating-label">{reviewOptions.find(option => option.value === message.rating)?.label || '服务评价'}{message.anonymous ? ' · 匿名评价' : ' · 服务评价'}</div>}<p>{message.text?.replace('已经和龙师傅确认过了，', '')}</p></article>
          </>}
          {message.kind === 'transfer-intro' && quickActionsVisible(state, index, input) && <div className="journey-quick-actions">{['先咨询费用', '我要预约接送'].map(text => <button className="journey-price-reply" key={text} onClick={() => dispatch({ type: 'TRANSFER_SEND', text })}>{text}<ArrowUpRightIcon /></button>)}</div>}
          {message.kind === 'transfer-departure' && <DepartureServices currentService={message.service === 'charter' ? 'charter' : 'transfer'} services={services} dailyService={dailyService} onOpen={onOpenService} />}
          {message.kind === 'welcome' && <GuideServices services={services} onOpen={onOpenService} />}
          {message.kind === 'suggestion' && quickActionsVisible(state, index, input) && <div className="journey-quick-actions"><button className="journey-price-reply" onClick={() => dispatch({ type: 'DETAILS' })}>给我更详细的出行方案<ArrowUpRightIcon /></button>{state.phase === 'suggestion' && <button className="journey-price-reply" onClick={() => dispatch({ type: 'THINK' })}>再想想<ArrowUpRightIcon /></button>}</div>}
          {tripFinished && (state.phase === 'cancelled' ? index === state.messages.length - 1 : message.kind === 'payment-confirmation') && orderCard}
        </div>)}
      </div>
      {transferAutoOrder && !state.transfer?.active && !paused && <div className="journey-typing" role="status"><span /><span /><span />龙师傅正在更新{isDailyCharter(transferAutoOrder.product) ? '包车' : '接送'}安排</div>}
      {isAuto && !['lost-question', 'lost-acknowledgement'].includes(state.phase) && <div className="journey-typing" role="status"><span /><span /><span />{state.phase === 'lost-confirmation' ? '龙师傅正在车上找帽子' : state.phase === 'preparing' ? '龙师傅正在整理出行方案' : ['paid', 'departed', 'service'].includes(state.phase) ? '龙师傅正在更新行程' : '龙师傅正在回复'}</div>}
    </section>

    {target && !hidden && createPortal(<ConversationComposer input={input} setInput={setInput} onSend={send} guideName="龙师傅" suspended={paused} disabled={!state.transfer?.active && (pendingTransfer || state.phase !== 'intro') && !(state.phase === 'plans' && state.consultRequested)} onInputFocus={() => { if (input) return; if (state.transfer?.active) setInput((isDailyCharter(state.transfer.product) ? charterInputDraft : transferInputDraft)(state.transfer.booking)); else if (!pendingTransfer && state.phase === 'intro') setInput(INTENTION) }} composerRef={composerRef} />, target)}

    {target && modal?.startsWith('transfer-') && selectedTransferOrder && createPortal(<TransferOrderDialog key={`${modal}-${selectedTransferId}`} order={selectedTransferOrder} mode={modal} onClose={close} dispatch={dispatch} />, target)}
    {target && modal && !modal.startsWith('transfer-') && createPortal(<section className={`journey-detail${modal === 'detail' ? ' journey-plan-detail' : modal === 'itinerary' ? ' journey-plan-detail journey-itinerary-detail' : modal === 'charter' ? ' journey-charter-detail' : ''}`} role="dialog" aria-modal={!(paymentOpen || dateOpen)} aria-label={{ charter: '按天包车', detail: '游玩方案详情', checkout: '确认付款', itinerary: '行程单', order: '订单信息', manage: '改期与取消' }[modal]} ref={dialogRef} tabIndex={-1} onKeyDown={trapKeys}>
      <header className="journey-detail-nav" inert={paymentOpen || dateOpen}><button aria-label={backLabel} onClick={close}><ArrowLeftIcon /></button>{['detail', 'itinerary'].includes(modal) ? <span aria-hidden="true" /> : <h2>{{ charter: '按天包车', checkout: '确认付款', itinerary: '行程单', order: '订单信息', manage: '改期 / 取消' }[modal]}</h2>}<span aria-hidden="true" /></header>
      <div className="journey-detail-body" inert={paymentOpen || dateOpen} key={modal}>
        {modal === 'detail' && <PlanOverview />}
        {modal === 'charter' && <CharterOverview showRoute={!!currentInquiry} serviceOnly={charterServiceOnly} booking={{ ...booking, onSubmit: () => setPaymentOpen(true) }} setBooking={setBooking} onOpenRange={openRange} rangeOpen={dateOpen} />}
        {modal === 'itinerary' && <ItineraryOverview start={order.start} passengers={order.booking?.passengers || 4} />}
        {modal === 'order' && <section className="journey-detail-section"><span className="journey-order-status"><CheckCircleIcon />{order.status}</span><h1>省内按天包车 · 商务7座</h1><dl className="journey-fields"><div><dt>订单编号</dt><dd>{order.number}</dd></div><div><dt>服务司导</dt><dd>龙师傅 · 商务7座</dd></div><div><dt>同行人数</dt><dd>{order.booking?.passengers || 4}人</dd></div><div><dt>出行日期</dt><dd>{charterDateLabel(order.start)}</dd></div><div><dt>接驾安排</dt><dd>{tripDayLabel(order.start, 1)} {order.booking?.pickupAt?.slice(11) || '10:56'} · 贵阳北站网约车接送区</dd></div><div><dt>支付金额</dt><dd><Price prefix="¥" value={order.amount.toLocaleString()} auxiliaryWeight={400} /></dd></div>{order.refunded && <div><dt>退款状态</dt><dd>全额退款 <Price prefix="¥" value={order.amount.toLocaleString()} auxiliaryWeight={400} /></dd></div>}</dl><button className="journey-primary" onClick={() => setModal('itinerary')}>查看行程单</button></section>}
        {modal === 'manage' && <section className="journey-detail-section"><h1>出行计划有变化？</h1><p>当前行程：{charterDateLabel(order.start)} · {orderPlan.title}</p>{state.phase === 'paid' ? <>
          <form className="journey-change-form" onSubmit={saveDate}><h2>调整出发日期</h2><button type="button" className="journey-date-field" aria-haspopup="dialog" aria-expanded={dateOpen} onClick={() => { setDateDraft(changeDate); setDateOpen(true) }}><CalendarCheckIcon /><span>{changeDate.replace(/-/g, ' / ')}</span><CaretRightIcon /></button><p>行程将整体顺延。音乐节场次、食宿余位由龙师傅再次确认。</p>{changeError && <p role="alert" className="journey-error">{changeError}</p>}<button className="journey-primary" disabled={!changeDate || changeDate === order.start}>确认改期</button></form>
          <div className="journey-cancel"><h2>取消本次预约</h2><p>取消后全额退款 <Price prefix="¥" value={order.amount.toLocaleString()} auxiliaryWeight={400} />。</p>{cancelConfirm ? <div className="journey-cancel-confirm"><strong>确定取消这次行程吗？</strong><button className="journey-danger" onClick={() => { dispatch({ type: 'CANCEL' }); close() }}>确认取消并退款</button><button onClick={() => setCancelConfirm(false)}>保留行程</button></div> : <button className="journey-danger" onClick={() => setCancelConfirm(true)}>申请取消订单</button>}</div>
        </> : <><p>{order.refunded ? '此订单已取消，退款已完成。' : '当前订单已进入服务或完成阶段，如需调整，请电话联系龙师傅协商。'}</p><button className="journey-primary">电话龙师傅</button></>}</section>}
      </div>
      {modal === 'charter' && <footer className="journey-detail-footer" inert={paymentOpen || dateOpen}><div><small>{charterServiceOnly ? '按天包车' : currentInquiry ? '包车总价' : '2天包车总价'}</small><strong><Price value={charterServiceOnly ? '900' : currentAmount.toLocaleString()} suffix={charterServiceOnly ? ' / 天' : ''} auxiliaryWeight={400} /></strong></div>{charterServiceOnly ? <button className="journey-primary" type="button" onClick={() => { close(); setInput(''); dispatch(freshCharterInquiry ? { type: 'TRANSFER_START', product: dailyService, fresh: true } : { type: 'CHARTER_START' }); onCharterConsult?.() }}>咨询/下单</button> : <button className="journey-primary" type="submit" form="family-booking-form" disabled={currentInquiry ? inquirySubmitted : !!order}>{(currentInquiry ? inquirySubmitted : order) ? '已生成订单' : '去付款'}</button>}</footer>}
      {dateOpen && <div className="journey-payment-backdrop" onClick={event => { if (event.target === event.currentTarget) setDateOpen(false) }}>
        <section className={`journey-payment-sheet journey-date-sheet${modal === 'charter' ? ' journey-range-sheet' : ''}`} role="dialog" aria-modal="true" aria-label={modal === "charter" ? "选择用车日期" : "选择出发日期"} tabIndex={-1} ref={dateRef}>
          <div className="journey-sheet-handle" aria-hidden="true" />
          <header><h2>{modal === 'charter' ? '选择用车日期' : '选择出发日期'}</h2><button type="button" className="sheet-close" aria-label="关闭日期选择" onClick={() => setDateOpen(false)}><XIcon /></button></header>
          {modal === 'charter' ? <>
            <MobileDatePicker value={rangeDraft.start} rangeEnd={rangeDraft.end} rangeMode onChange={pickRangeDate} />
            {!rangeValid && <p className="journey-error" role="status">请选择结束日期。</p>}
            <button type="button" className="journey-primary" disabled={!rangeValid} onClick={() => { setBooking(b => ({ ...b, pickupAt: `${rangeDraft.start}T${rangeDraft.startTime}`, returnAt: `${rangeDraft.end}T${rangeDraft.endTime}` })); setDateOpen(false) }}>确定</button>
          </> : <><MobileDatePicker value={dateDraft} onChange={setDateDraft} /><button type="button" className="journey-primary" onClick={() => { setChangeDate(dateDraft); setDateOpen(false) }}>确定日期</button></>}

        </section>
      </div>}
      {paymentOpen && <div className="journey-payment-backdrop" onClick={event => { if (event.target === event.currentTarget) setPaymentOpen(false) }}>
        <section className="journey-payment-sheet" role="dialog" aria-modal="true" aria-label="确认付款" tabIndex={-1} ref={paymentRef}>
          <div className="journey-sheet-handle" aria-hidden="true" />
          <h2>确认付款</h2>
          <div className="journey-payment-total"><span>本次应付</span><strong><Price value={currentAmount.toLocaleString()} prefix="¥" auxiliaryWeight={400} /></strong></div>
          <button className="journey-primary" disabled={currentInquiry ? inquirySubmitted || !!charterIssues(currentInquiry).length : !!order} onClick={pay}>确认付款</button>
        </section>
      </div>}

    </section>, target)}
  </>
}
