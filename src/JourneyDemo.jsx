import GuideServices from './GuideServices'
import ConversationComposer from './ConversationComposer'
import { useEffect, useReducer, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRightIcon, ArrowLeftIcon, CalendarCheckIcon, CarProfileIcon, CheckCircleIcon, MapPinIcon, PhoneIcon, ReceiptIcon, SparkleIcon, XCircleIcon, CaretLeftIcon, CaretRightIcon, CaretDownIcon } from '@phosphor-icons/react'
import { autoPhases, dateLabel, initialJourney, INTENTION, itinerary, journeyReducer, plans, PUSH_DELAY, DEFAULT_START, tripDayLabel, tripDate, isoDate, vehicle } from './journeyFlow'
import './journey.css'

function MobileDatePicker({ value, onChange }) {
  const [month, setMonth] = useState(() => new Date(`${value || DEFAULT_START}T12:00:00`))
  const year = month.getFullYear(), monthIndex = month.getMonth()
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const days = new Date(year, monthIndex + 1, 0).getDate()
  const moveMonth = delta => setMonth(new Date(year, monthIndex + delta, 1, 12))
  return <section className="journey-mobile-calendar" aria-label="选择出发日期">
    <header><button type="button" aria-label="上个月" disabled={year === 2026 && monthIndex === 8} onClick={() => moveMonth(-1)}><CaretLeftIcon /></button><strong>{year}年{monthIndex + 1}月</strong><button type="button" aria-label="下个月" onClick={() => moveMonth(1)}><CaretRightIcon /></button></header>
    <div className="journey-calendar-grid">{['日','一','二','三','四','五','六'].map(day => <span key={day}>{day}</span>)}
      {Array.from({ length: firstWeekday }, (_, i) => <span key={`empty-${i}`} />)}
      {Array.from({ length: days }, (_, i) => { const day = i + 1, date = isoDate(new Date(year, monthIndex, day, 12)); return <button key={date} type="button" disabled={date < DEFAULT_START} aria-label={`${year}年${monthIndex + 1}月${day}日`} aria-pressed={value === date} onClick={() => onChange(date)}>{day}</button> })}
    </div><p className="journey-calendar-selected"><CalendarCheckIcon />{dateLabel(value)}<span>4天3晚</span></p>
  </section>
}

function TripDays({ start = 24, guided = false }) {
  return <ol className="journey-days">{itinerary.map((day, i) => <li key={day.title}>
    <div className="journey-day-date"><b>D{i + 1}</b><span>{tripDayLabel(start, i)}</span></div>
    <div><h3>{i === 0 ? '贵阳 → 毕节' : day.city}</h3><h4 className="journey-day-theme">{day.title}</h4><p>{day.text}</p><dl className="journey-day-facts"><div><dt>景点</dt><dd>{dayDetails[i].spots}</dd></div>{dayDetails[i].dailyMeals.map((meal, index) => <div key={index}><dt>{['早餐', '午餐', '晚餐'][index]}</dt><dd>{meal}</dd></div>)}<div><dt>住宿</dt><dd>{dayDetails[i].hotel}</dd></div>{i > 1 && <div><dt>{guided ? '导游' : '接送'}</dt><dd>{guided ? '龙师傅陪同游览 · 随走随讲' : '定点接送 · 自由游览'}</dd></div>}</dl></div>
  </li>)}</ol>
}


const dayDetails = [
  { dailyMeals: ['自行安排', '抵达后自行用餐', '大方当地餐厅，可协助预订，费用自理'], spots: '贵阳龙洞堡机场 · 毕节大方', meals: '当地晚餐自理，可协助预订', hotel: '大方酒店，协助预订、费用自理' },
  { dailyMeals: ['酒店或周边用餐，费用自理', '音乐节周边自由用餐，费用自理', '大方本地风味，费用自理'], spots: '大地指纹音乐节 · 毕节大方', meals: '三餐自理，推荐本地风味', hotel: '大方酒店，协助预订、费用自理' },
  { dailyMeals: ['酒店或周边用餐，费用自理', '贵阳当地餐厅，费用自理', '营地餐饮，费用自理'], spots: '贵阳周边湖畔 · 水边营地', meals: '营地餐饮自理', hotel: '贵阳酒店或营地住宿，费用自理', image: '/assets/sunlit-mountain-lake-hero.png', alt: '湖畔山水风景示意' },
  { dailyMeals: ['住宿地周边用餐，费用自理', '青岩状元蹄及特色小吃，费用自理', '返回贵阳后自行安排'], spots: '青岩古镇 · 石板巷 · 咖啡馆', meals: '状元蹄、特色小吃与咖啡自理', hotel: '无住宿安排，送回贵阳市区', image: '/assets/qingyan-village-panorama.png', alt: '古镇屋顶与青山风景' },
]

const planCardImages = {
  transfer: { src: '/assets/tianhetan-waterfall.png', alt: '贵州山水与瀑布' },
  guided: { src: '/assets/qingyan-village-panorama.png', alt: '青岩古镇民居与山景' },
}

function PlanOverview({ plan }) {
  const guided = plan.id === 'guided'
  const features = guided ? [
    '毕节的食宿交通协助预订，贵阳两天包车慢游。',
    '龙师傅开车兼讲解，音乐节、露营和古镇美食一次安排。',
    '一家4口独立用车，可根据家人的体力调整游玩节奏。',
  ] : [
    '商务7座独立用车，毕节往返与贵阳周边定点接送。',
    '音乐节、水边露营、青岩美食，约好时间随心游玩。',
    '协助预订当地食宿，游玩时间和停留节奏自己安排。',
  ]
  return <>
    <img className="plan-cover" src="/assets/qingyan-village-panorama.png" alt="古镇屋顶与青山风景" />
    <section className="plan-introduction"><h1>毕节＋贵阳4日游</h1><p>{plan.title}，{plan.description}</p></section>
    <section className="plan-section"><h2><SparkleIcon />行程特色</h2><ul className="plan-features">{features.map(text => <li key={text}><CheckCircleIcon weight="fill" /><span>{text}</span></li>)}</ul></section>
    <section className="plan-section"><h2><CalendarCheckIcon />行程速览</h2><div className="plan-day-list">{itinerary.map((day, index) => {
      const details = dayDetails[index]
      return <article className="plan-day-card" key={day.title}>
        <header><div className="plan-day-heading"><span className="plan-day-badge">D{index + 1}</span><h3>9月{24 + index}日</h3></div><b>{day.city}</b></header>
        <dl><div><dt>景点</dt><dd>{details.spots}</dd></div><div><dt>三餐</dt><dd>{details.meals}</dd></div><div><dt>住宿</dt><dd>{details.hotel}</dd></div></dl>
        <p>{day.text}{index > 1 ? guided ? '龙师傅陪同游览，随走随讲。' : '定点接送，自由游览。' : ''}</p>
        {details.image && <img src={details.image} alt={details.alt} loading="lazy" />}
      </article>
    })}</div></section>
    <section className="plan-section"><h2><ReceiptIcon />费用说明</h2>
      <div className="plan-fee-card included"><h3><CheckCircleIcon weight="fill" />此行程费用包含：</h3><dl>
        <div><dt>【用车】</dt><dd>商务7座专车，4人独立用车；按行程单提供接送。</dd></div>
        <div><dt>【交通】</dt><dd>约定行程内的司机、燃油、高速及停车费用。</dd></div>
        <div><dt>【服务】</dt><dd>{guided ? '毕节食宿预订协助，贵阳2天包车及司导陪同讲解。' : '食宿预订协助、当地玩法建议与接送协调。'}</dd></div>
      </dl></div>
      <div className="plan-fee-card excluded"><h3><XCircleIcon weight="fill" />此行程费用不包含：</h3><dl>
        <div><dt>【门票】</dt><dd>音乐节、景区门票与景区内自费体验项目。</dd></div>
        <div><dt>【食宿】</dt><dd>酒店、三餐、小吃、咖啡等个人消费。</dd></div>
        <div><dt>【露营】</dt><dd>营地、装备租赁与营地住宿费用。</dd></div>
        {!guided && <div><dt>【讲解】</dt><dd>不含陪同游览与景点讲解服务。</dd></div>}
      </dl></div>
    </section>
    <section className="plan-section plan-booking-notes"><h2><CarProfileIcon />预订须知</h2><p>{plan.scope}</p><p>9月24日—27日 · 4天3晚 · 一家4口。出发前可通过置顶订单申请改期或取消；涉及已预订食宿、门票的费用需与龙师傅确认。</p></section>
  </>
}

export default function JourneyDemo({ hidden = false, appRef, homeRef, suspended, onModalChange, services = [], onOpenService }) {
  const [state, dispatch] = useReducer(journeyReducer, undefined, initialJourney)
  const [input, setInput] = useState('')
  const [priceReplyDismissed, setPriceReplyDismissed] = useState(false)
  const [modal, setModal] = useState(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const paymentRef = useRef(null)
  const [target, setTarget] = useState(null)
  const [chosen, setChosen] = useState(plans[1])
  const [orderExpanded, setOrderExpanded] = useState(false)
  const [rating, setRating] = useState(null)
  const [reviewTags, setReviewTags] = useState([])
  const reviewOptions = [{ value: 1, label: '非常差', icon: 'poor' }, { value: 3, label: '一般般', icon: 'okay' }, { value: 5, label: '超级棒', icon: 'great' }]
  const availableReviewTags = rating === 1 ? ['接送不准时', '沟通待改善', '车内不整洁', '路线不熟悉', '讲解不清楚', '服务不周到'] : rating === 3 ? ['接送较准时', '沟通一般', '车辆较整洁', '行程较合理', '讲解一般', '服务待提升'] : ['接送准时', '耐心细致', '驾驶平稳', '熟悉路线', '车辆整洁', '服务贴心']
  const [review, setReview] = useState('')
  const [changeDate, setChangeDate] = useState(DEFAULT_START)
  const [dateOpen, setDateOpen] = useState(false)
  const [dateDraft, setDateDraft] = useState(DEFAULT_START)
  const dateRef = useRef(null)
  useEffect(() => {
    if (!dateOpen) return
    const previous = document.activeElement
    dateRef.current?.focus()
    return () => { if (previous?.isConnected) previous.focus() }
  }, [dateOpen])
  const [changeError, setChangeError] = useState('')
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [coverScrolled, setCoverScrolled] = useState(false)
  const latestRef = useRef(null)
  const pinnedRef = useRef(null)
  const dialogRef = useRef(null)
  const composerRef = useRef(null)
  const order = state.order
  const orderPlan = plans.find(plan => plan.id === order?.planId)
  const paused = suspended || !!modal
  const isAuto = autoPhases.includes(state.phase)

  useEffect(() => setTarget(appRef.current), [appRef])
  useEffect(() => { onModalChange(!!modal); return () => onModalChange(false) }, [modal, onModalChange])
  useEffect(() => {
    if (!isAuto || paused) return
    const timer = window.setTimeout(() => dispatch({ type: 'ADVANCE' }), PUSH_DELAY)
    return () => window.clearTimeout(timer)
  }, [state.phase, state.messages.length, isAuto, paused])
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
    dialogRef.current?.focus()
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
    if (state.phase === 'intro' && input.trim()) { dispatch({ type: 'SEND', text: input }); setInput('') }
  }
  const openPlan = plan => { setPriceReplyDismissed(true); setChosen(plan); setCoverScrolled(false); setModal('detail') }
  const pay = () => {
    dispatch({ type: 'PAY', planId: chosen.id, number: `LG20260924${String(Date.now()).slice(-6)}` })
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
    const controls = [...activeDialog.querySelectorAll('button:not(:disabled), input, textarea, [tabindex="0"]')]
    const first = controls[0], last = controls.at(-1)
    if (event.shiftKey && (document.activeElement === first || document.activeElement === activeDialog)) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }

  const tripFinished = ['review', 'thanks', 'lost-question', 'lost-confirmation', 'lost-acknowledgement', 'done', 'cancelled'].includes(state.phase)
  const orderCard = order && <section ref={pinnedRef} className={`journey-order${tripFinished ? ' journey-order-history' : ''}`} aria-label={tripFinished ? '行程订单' : '置顶订单'}>
        <div className="journey-order-summary"><strong>{orderPlan.title}</strong><span className={`journey-pinned-status${order.refunded ? ' muted' : ''}`}>{order.status}</span></div>
        <div className="journey-order-meta"><p>{dateLabel(order.start)} · 毕节＋贵阳</p>{!tripFinished && <button className="journey-order-toggle" type="button" aria-expanded={orderExpanded} aria-controls="journey-order-details" onClick={() => setOrderExpanded(value => !value)}>{orderExpanded ? '收起' : '展开'}<CaretDownIcon aria-hidden="true" /></button>}</div>
        <div id="journey-order-details" className="journey-order-details" hidden={!tripFinished && !orderExpanded}>
          <h4>行程线路</h4>
          <p className="journey-service-route">贵阳龙洞堡机场 → 毕节大方 → 贵阳 → 青岩</p>
          <div className="journey-pickup-vehicle" aria-label="接驾车辆信息"><div><strong>{vehicle.plate} · {vehicle.color}</strong><span>{vehicle.model} · 商务7座</span></div><img src={vehicle.image} alt={`${vehicle.color}${vehicle.model}商务7座`} /></div>
        </div>
        <div className="journey-order-actions">
          <button onClick={() => { setCoverScrolled(false); setModal('itinerary') }}><ReceiptIcon aria-hidden="true" />行程单</button>
          <button onClick={manage} disabled={state.phase !== 'paid'}><CalendarCheckIcon aria-hidden="true" />改期/取消</button>
          <button><PhoneIcon aria-hidden="true" />联系龙师傅</button>
        </div>
      </section>

  return <>
    <section className="journey-chat charter-chat" aria-label="与龙师傅的出行对话">
      {!tripFinished && orderCard}
      <div className="chat-messages" role="log" aria-live="polite" aria-relevant="additions">
        {state.messages.map((message, index) => <div className="journey-message-wrap" key={index} ref={index === state.messages.length - 1 ? latestRef : null}>
          {message.type === 'plans' ? <section className="journey-plans" aria-label="两种游玩方案">
            <article className="chat-message assistant journey-plan-intro"><p>您一家四口这趟，我整理了两种走法：一种我负责接送，您自由玩；另一种我开车也陪您逛、给您讲讲。9月24日到27日，商务7座坐得下，具体费用和哪些需要另付，我都写在下面了，您点开看看。</p></article>
            {plans.map(plan => <button key={plan.id} className="journey-plan-card" onClick={() => openPlan(plan)} aria-label={`查看方案${plan.number === '01' ? '1' : '2'}：${plan.title}`}>
              <span className="journey-plan-image-wrap"><img className="journey-plan-image" src={planCardImages[plan.id].src} alt={planCardImages[plan.id].alt} loading="lazy" /><span className="journey-plan-number">方案{Number(plan.number)}</span></span>
              <span className="journey-plan-corner" aria-hidden="true"><span>{plan.tag}</span></span>
              <div className="journey-plan-content">
                <div className="journey-plan-title"><h3>{plan.title}</h3></div><p>{plan.description}</p>
                <div className="journey-plan-route"><MapPinIcon />毕节大方 → 贵阳 → 青岩</div>
                <footer><b><small>¥</small>{plan.price.toLocaleString()}</b></footer>
              </div>
            </button>)}
            {state.phase === 'plans' && !state.discountAsked && !priceReplyDismissed && <button type="button" className="journey-price-reply" onClick={() => { setPriceReplyDismissed(true); dispatch({ type: 'ASK_DISCOUNT' }) }}>价格有优惠吗<ArrowUpRightIcon aria-hidden="true" /></button>}
          </section> : message.type === 'notice' ? (message.eta ? <><article className="chat-message assistant journey-departure-copy"><p>{message.text?.replace('已经和龙师傅确认过了，', '')}</p></article>          <section className="journey-other-services" aria-label="龙师傅的其他服务">
            <article className="chat-message assistant"><p>以后要是还想来贵州转转，点对点接送、7天6晚大环线我这边也有，您有兴趣可以先看看。</p></article>
            {services.map(service => <button className="journey-service-product" key={service.id} onClick={() => onOpenService(service)}>
              <img src={service.image} alt="" /><span><strong>{service.cardName || service.name}</strong><small>{service.cardDescription || service.intro}</small><b>{service.referencePrice ? <><small>参考价 ￥</small>{service.referencePrice}</> : <><small>￥</small>{service.price || service.priceLabel?.replace(/^[￥¥]/, "")}</>}</b></span>
            </button>)}
          </section></> : null) : message.type === 'review' ? <section className="journey-review">
            <header className="journey-review-heading"><h3>{order?.rating ? '感谢你的评价' : '本次服务怎么样？'}</h3></header>
            <div className="journey-reactions" role="group" aria-label="服务评分">{reviewOptions.map(option => <button type="button" key={option.value} disabled={state.phase !== 'review'} aria-pressed={rating === option.value} onClick={() => { setRating(option.value); setReviewTags([]) }}><img src={`/assets/review-${option.icon}.svg`} alt="" /><span>{option.label}</span></button>)}</div>
            <form onSubmit={event => { event.preventDefault(); if (!rating) return; dispatch({ type: 'REVIEW', text: [reviewTags.join('、'), review.trim()].filter(Boolean).join('。') || reviewOptions.find(option => option.value === rating).label, rating, tags: reviewTags }) }}>
              <div className="journey-review-tags" role="group" aria-label="评价标签">{availableReviewTags.map(tag => <button type="button" key={tag} disabled={state.phase !== 'review'} aria-pressed={reviewTags.includes(tag)} onClick={() => setReviewTags(current => current.includes(tag) ? current.filter(item => item !== tag) : [...current, tag])}>{tag}</button>)}</div>
              <textarea aria-label="其他评价" placeholder="其他评价（选填）" value={review} onChange={event => setReview(event.target.value)} disabled={state.phase !== 'review'} rows={3} />
              <button className="journey-primary" disabled={state.phase !== 'review' || !rating}>{order?.rating ? '评价已提交' : '确认评价'}</button>
            </form>
          </section> : <>
            <article className={`chat-message ${message.role}`}>{message.rating && <div className="journey-rating-label">{reviewOptions.find(option => option.value === message.rating)?.label || '服务评价'}{message.anonymous ? ' · 匿名评价' : ' · 服务评价'}</div>}<p>{message.text?.replace('已经和龙师傅确认过了，', '')}</p></article>
          </>}
          {index === 0 && <GuideServices services={services} onOpen={onOpenService} />}
          {tripFinished && (state.phase === 'cancelled' ? index === state.messages.length - 1 : message.kind === 'payment-confirmation') && orderCard}
        </div>)}
      </div>
      {isAuto && !['lost-question', 'lost-acknowledgement'].includes(state.phase) && <div className="journey-typing" role="status"><span /><span /><span />{state.phase === 'lost-confirmation' ? '龙师傅正在车上找帽子' : state.phase === 'preparing' ? '龙师傅正在整理两种方案' : ['paid', 'departed', 'service'].includes(state.phase) ? '龙师傅正在更新行程' : '龙师傅正在回复'}</div>}
    </section>

    {target && !hidden && createPortal(<ConversationComposer input={input} setInput={setInput} onSend={send} guideName="龙师傅" suspended={paused} disabled={state.phase !== 'intro'} onInputFocus={() => { if (!input && state.phase === 'intro') setInput(INTENTION) }} composerRef={composerRef} />, target)}

    {target && modal && createPortal(<section className={`journey-detail${modal === 'detail' ? ' journey-plan-detail' : modal === 'itinerary' ? ' journey-itinerary-detail' : ''}${coverScrolled ? ' cover-scrolled' : ''}`} role="dialog" aria-modal={!(paymentOpen || dateOpen)} aria-label={{ detail: '游玩方案详情', checkout: '确认付款', itinerary: '行程单', order: '订单信息', manage: '改期与取消' }[modal]} ref={dialogRef} tabIndex={-1} onKeyDown={trapKeys}>
      <header className="journey-detail-nav" inert={paymentOpen || dateOpen}><button aria-label="返回对话" onClick={close}><ArrowLeftIcon /></button><h2>{{ detail: '游玩方案', checkout: '确认付款', itinerary: '行程单', order: '订单信息', manage: '改期 / 取消' }[modal]}</h2><span aria-hidden="true" /></header>
      <div className="journey-detail-body" inert={paymentOpen || dateOpen} key={modal} onScroll={event => { if (modal === 'detail' || modal === 'itinerary') setCoverScrolled(event.currentTarget.scrollTop > 190) }}>
        {modal === 'detail' && <PlanOverview plan={chosen} />}
        {modal === 'itinerary' && <><section className="journey-detail-hero journey-itinerary-hero"><h1>毕节＋贵阳 · 4天3晚</h1><p>{dateLabel(order.start)} · {orderPlan.title}</p></section><section className="journey-detail-section"><TripDays start={order.start} guided={order.planId === 'guided'} /></section></>}
        {modal === 'order' && <section className="journey-detail-section"><span className="journey-order-status"><CheckCircleIcon />{order.status}</span><h1>{orderPlan.title}</h1><dl className="journey-fields"><div><dt>订单编号</dt><dd>{order.number}</dd></div><div><dt>服务司导</dt><dd>龙师傅 · 商务7座</dd></div><div><dt>同行人数</dt><dd>一家4口</dd></div><div><dt>出行日期</dt><dd>{dateLabel(order.start)}</dd></div><div><dt>接驾安排</dt><dd>{tripDayLabel(order.start)} 08:30 · 贵阳龙洞堡机场</dd></div><div><dt>支付金额</dt><dd>¥{order.amount.toLocaleString()}</dd></div>{order.refunded && <div><dt>退款状态</dt><dd>全额退款 ¥{order.amount.toLocaleString()}</dd></div>}</dl><button className="journey-primary" onClick={() => setModal('itinerary')}>查看行程单</button></section>}
        {modal === 'manage' && <section className="journey-detail-section"><h1>出行计划有变化？</h1><p>当前行程：{dateLabel(order.start)} · {orderPlan.title}</p>{state.phase === 'paid' ? <>
          <form className="journey-change-form" onSubmit={saveDate}><h2>调整出发日期</h2><button type="button" className="journey-date-field" aria-haspopup="dialog" aria-expanded={dateOpen} onClick={() => { setDateDraft(changeDate); setDateOpen(true) }}><CalendarCheckIcon /><span>{changeDate.replace(/-/g, ' / ')}</span><CaretRightIcon /></button><p>行程将整体顺延。音乐节场次、食宿余位由龙师傅再次确认。</p>{changeError && <p role="alert" className="journey-error">{changeError}</p>}<button className="journey-primary" disabled={!changeDate || changeDate === order.start}>确认改期</button></form>
          <div className="journey-cancel"><h2>取消本次预约</h2><p>取消后全额退款 ¥{order.amount.toLocaleString()}。</p>{cancelConfirm ? <div className="journey-cancel-confirm"><strong>确定取消这次行程吗？</strong><button className="journey-danger" onClick={() => { dispatch({ type: 'CANCEL' }); close() }}>确认取消并退款</button><button onClick={() => setCancelConfirm(false)}>保留行程</button></div> : <button className="journey-danger" onClick={() => setCancelConfirm(true)}>申请取消订单</button>}</div>
        </> : <><p>{order.refunded ? '此订单已取消，退款已完成。' : '当前订单已进入服务或完成阶段，如需调整，请电话联系龙师傅协商。'}</p><button className="journey-primary">电话龙师傅</button></>}</section>}
      </div>
      {modal === 'detail' && <footer className="journey-detail-footer" inert={paymentOpen || dateOpen}><div><small>方案总价</small><strong>¥{chosen.price.toLocaleString()}</strong></div><button className="journey-primary" disabled={!!order} onClick={() => setPaymentOpen(true)}>{order ? '已生成订单' : '去付款'}</button></footer>}
      {dateOpen && <div className="journey-payment-backdrop" onClick={event => { if (event.target === event.currentTarget) setDateOpen(false) }}>
        <section className="journey-payment-sheet journey-date-sheet" role="dialog" aria-modal="true" aria-label="选择出发日期" tabIndex={-1} ref={dateRef}>
          <div className="journey-sheet-handle" aria-hidden="true" />
          <header><h2>选择出发日期</h2><button type="button" onClick={() => setDateOpen(false)}>取消</button></header>
          <MobileDatePicker value={dateDraft} onChange={setDateDraft} />
          <button type="button" className="journey-primary" onClick={() => { setChangeDate(dateDraft); setDateOpen(false) }}>确定日期</button>
        </section>
      </div>}
      {paymentOpen && <div className="journey-payment-backdrop" onClick={event => { if (event.target === event.currentTarget) setPaymentOpen(false) }}>
        <section className="journey-payment-sheet" role="dialog" aria-modal="true" aria-label="确认付款" tabIndex={-1} ref={paymentRef}>
          <div className="journey-sheet-handle" aria-hidden="true" />
          <h2>确认付款</h2>
          <div className="journey-payment-total"><span>本次应付</span><strong><small>¥</small>{chosen.price.toLocaleString()}</strong></div>
          <button className="journey-primary" disabled={!!order} onClick={pay}>确认付款</button>
        </section>
      </div>}

    </section>, target)}
  </>
}
