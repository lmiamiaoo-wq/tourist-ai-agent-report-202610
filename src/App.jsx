import ShareGuideSheet from './ShareGuideSheet'
import GuideServices from './GuideServices'
import ConversationComposer from './ConversationComposer'
import { ContactSheet, Storefront } from './TravelBooking'
import JourneyDemo from './JourneyDemo'
import { INTRO } from './journeyFlow'
import { createPortal } from 'react-dom'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  BatteryHighIcon,
  BellIcon,
  CalendarCheckIcon,
  CellSignalHighIcon,
  CaretRightIcon,
  CheckCircleIcon,
  HeartIcon,
  HouseIcon,
  HeadphonesIcon,
  PhoneIcon,
  GearIcon,
  PencilSimpleIcon,
  SignOutIcon,
  IdentificationCardIcon,
  IdentificationBadgeIcon,
  ChatCircleIcon,
  MapPinIcon,
  CameraIcon,
  CarProfileIcon,
  ShieldCheckIcon,
  MinusIcon,
  PlusIcon,
  ListIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ReceiptIcon,
  ShareNetworkIcon,
  SparkleIcon,
  WifiHighIcon,
  XIcon,
  XCircleIcon,
} from '@phosphor-icons/react'

const recommendations = [
  {
    id: 'huangguoshu',
    name: '点对点包车',
    type: '司机服务',
    price: '240',
    priceLabel: '￥240',
    unit: '天',
    image: '/assets/sunlit-mountain-lake-hero.png',
    cardDescription: '贵阳出发·点对点包车·市区 / 景区 / 机场接送',
    intro: '贵阳出发·点对点包车·市区 / 景区 / 机场接送',
    serviceDetails: [
      { label: '司导一体', text: '本人10年以上本地驾龄司机，兼持证导游，开车讲解两不误' },
      { label: '路况熟', text: '熟悉贵阳及周边（黄果树、荔波、西江千户苗寨、梵净山、兴义等）全部路线，避开拥堵' },
      { label: '纯玩承诺', text: '无购物、无隐形消费，行程自由，随时停靠拍照' },
      { label: '车辆整洁', text: '七座商务，每日清洁消毒，车内常备矿泉水、充电线、雨伞，最多承运6人4大件行李' },
      { label: '安全可靠', text: '全额营运保险，驾驶记录良好，可提供资质核验' },
    ],
    bookingNotices: [
      '拍前请先咨询，确认日期、路线、人数后再付款',
      '高峰期（节假日 / 周末）建议提前3–7天预订',
      '出发前24小时可免费取消；24小时内取消收取30%违约金',
    ],
    bookingFlow: ['下单付款', '司机接单', '沟通确认', '接驾出发', '行程结束'],
    pricingMethods: [
      { label: '点对点一口价', text: '按实际行程耗时计算，起步含2小时基础服务' },
      { label: '超时长', text: '超出基础时长按50元 / 小时加收，不足1小时按1小时计' },
      { label: '服务时段', text: '07:00–22:00正常服务；22:00–次日06:00夜间服务加收夜间费' },
      { label: '等待费', text: '客户原因导致等待，超30分钟后按30元 / 小时计' },
    ],
    features: ['专属司机一日包车，省去换乘烦恼。', '出发时间与上下车地点可提前与司机沟通。', '根据同行家人的体力，灵活安排游玩节奏。'],
    details: [{ day: '1日', city: '安顺 · 黄果树', spots: '黄果树景区', meals: '午餐自理', hotel: '无住宿安排', text: '在约定地点上车，前往黄果树景区游玩，当日按约定时间返程。具体接送地点与行程安排请提前与司机确认。' }],
    charter: {
      days: '1天', dailyHours: '8小时', mileage: '300公里', seats: '4个',
      stops: [
        { name: '您的起点', label: '上门接送', description: '按约定时间在贵阳市区酒店或指定地点上车，司机提前联系确认出发安排。' },
        { name: '黄果树景区', label: '自由游览', description: '乘车前往黄果树景区，自由安排观瀑、拍照与午餐时间。司机在约定地点等候，游览结束后接您返程。' },
        { name: '您的终点', label: '安心返程', description: '返回贵阳市区酒店或约定下车点，结束一日行程。上下车地点可在出发前与司机沟通。' },
      ],
    },
    fees: {
      included: [
        { label: '车辆使用费', text: '包含约定服务时段内的车辆使用。' },
        { label: '司机服务费', text: '包含司机驾驶与行程协调服务。' },
        { label: '燃油费', text: '包含约定行程范围内的燃油费用。' },
        { label: '景点讲解', text: '包含行程中的景点讲解服务。' },
      ],
      excluded: [
        { label: '实报实销', text: '高速过路费、停车费和景区门票。' },
        { label: '司机食宿', text: '跨天 / 异地时补贴100元 / 天。' },
        { label: '夜间费', text: '22:00–06:00时段加收50元 / 次。' },
      ],
    },
  },
  {
    id: 'guizhou-panorama-7d6n',
    name: '自然珍宝奇趣之旅7天6晚大环线',
    cardName: '自然珍宝奇趣之旅7天6晚大环线',
    cardDescription: '商务包车/司导服务/优选餐厅',
    type: '线路',
    referencePrice: '6980',
    image: '/assets/guizhou-panorama-7d6n-cover.png',
    detailImage: '/assets/guizhou-panorama-7d6n-detail.jpg',
    intro: '一次串联黄果树、荔波、西江、镇远与梵净山，7天深度畅游贵州经典山水与人文秘境，专车舒适出行。',
  },
]

const quickPrompts = ['带我玩', '特色服务']

const vehicleModels = {
  '经济5座': '吉利曹操60',
  '舒适5座': '比亚迪秦 PLUS EV',
  '经济7座': '五菱佳辰',
  '舒适7座': '别克GL8',
}

const serviceDetailIcons = {
  '司导一体': IdentificationBadgeIcon,
  '路况熟': MapPinIcon,
  '纯玩承诺': CameraIcon,
  '车辆整洁': CarProfileIcon,
  '安全可靠': ShieldCheckIcon,
}

const vehicleImageForTier = (tier) => tier === '经济5座'
  ? '/assets/economy-5-seat-sedan.png'
  : '/assets/ride-comfort-sedan.png'

const formatTripWindow = (departureAt) => {
  const start = new Date(departureAt.replace(' ', 'T'))
  const end = new Date(start.getTime() + 8 * 60 * 60 * 1000)
  const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
  return `${departureAt}-${endTime}`
}

const RouteTimeline = ({ stops }) => <ol className="route-timeline" aria-label="行程线路">
  {stops.map((stop, index) => <li key={`${stop}-${index}`}>{stop}</li>)}
</ol>

const TripProgressCard = ({ trip, onCall, className = '' }) => (
  <section className={`chat-trip-progress ${className}`.trim()} aria-label={`${trip.name || trip.businessName}·${trip.status}`}>
    <header>
      <div><strong>{trip.name || trip.businessName}</strong><small>{trip.date || trip.time}</small></div>
      <span className={trip.tone || ''}>{trip.status}</span>
    </header>
    <div className="progress-route">
      <h4>行程线路</h4>
      <p className="progress-route-inline">{(trip.routeStops || trip.route.split('-')).join(' - ')}</p>
    </div>
    <div className="trip-progress-assignment">
      <div className="trip-progress-vehicle">
        <div><strong>{trip.vehiclePlate} · {trip.vehicleColor}</strong><span>{trip.vehicleModel}</span></div>
        <img src={vehicleImageForTier(trip.vehicleTier || (trip.vehicleModel === vehicleModels['经济5座'] ? '经济5座' : ''))} alt="行程车辆" />
      </div>
      <div className="trip-progress-driver">
        <img src="/assets/yang-tonghai-avatar.png" alt={`司机${trip.driver || trip.driverName}`} />
        <strong>{trip.driver || trip.driverName}</strong>
        <button type="button" aria-label="给司机打电话" onClick={onCall}><PhoneIcon weight="fill" aria-hidden="true" /></button>
      </div>
    </div>
  </section>
)

const createTripProgress = (order) => {
  return {
    orderNo: order.orderNo,
    businessName: '贵旅出行-日包车',
    status: '进行中',
    time: formatTripWindow(order.departureAt),
    route: (order.routeLocations || ['贵阳大十字喷泉池高空亚朵酒店', '黄果树瀑布', '贵阳市6城区']).join('-'),
    vehiclePlate: order.vehiclePlate,
    vehicleColor: order.vehicleColor,
    vehicleModel: order.vehicleModel,
    vehicleTier: order.vehicleTier,
    driverName: '龙师傅',
  }
}

const formatLocalDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addCalendarDays = (date, amount) => {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return nextDate
}

const formatMonthDay = (date) => `${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`

const getBookingDateOptions = () => {
  const today = new Date()
  return [
    { label: '今天', date: today },
    { label: '明天', date: addCalendarDays(today, 1) },
    { label: addCalendarDays(today, 2).toLocaleDateString('zh-CN', { weekday: 'short' }), date: addCalendarDays(today, 2) },
  ]
}

const formatSelectedMonthDay = (value = '') => {
  const [, month = '', day = ''] = value.split('-')
  return month && day ? `${month}月${day}日` : ''
}

const createDefaultOrder = () => {
  return { travelDate: formatLocalDate(new Date()), adults: 2, children: 0, seniors: 0, phone: '', pickup: '' }
}



const tripGroups = [
  {
    title: '进行中',
    trips: [
      { name: '贵旅出行-日包车', date: '今天 08:30-18:30', routeStops: ['贵阳市区', '黄果树瀑布', '贵阳市区'], driver: '龙师傅', status: '进行中', tone: 'active', vehiclePlate: '贵A·K7286', vehicleColor: '银色', vehicleModel: '吉利曹操60' },
    ],
  },
  {
    title: '待出行',
    trips: [
      { name: '贵旅出行-青岩古镇半日游', date: '09月18日 13:00-18:00', routeStops: ['贵阳市区', '青岩古镇'], driver: '罗师傅', status: '待出行', tone: 'upcoming', vehiclePlate: '贵A·Q5182', vehicleColor: '白色', vehicleModel: '比亚迪秦 PLUS EV', vehicleTier: '经济5座' },
    ],
  },
]

const orderTabs = ['全部', '进行中', '待付款', '待出行', '退款/售后']
const orderSamples = [
  { id: 'QX20260914001', name: '贵旅出行-日包车', origin: '贵阳大十字喷泉池高空亚朵酒店', destination: '黄果树瀑布', createdAt: '2026-09-14 19:32', tripTime: '2026-09-15 09:00-17:00', driver: '龙师傅', vehicleModel: '日产轩逸', vehiclePlate: '贵A·K7286', amount: '580', status: '进行中', tone: 'active' },
  { id: 'QX20260918016', name: '贵旅出行-青岩古镇半日游', origin: '贵阳市南明区', destination: '青岩古镇南门', createdAt: '2026-09-14 20:08', tripTime: '2026-09-18 13:00-18:00', driver: '罗师傅', vehicleModel: '日产轩逸', vehiclePlate: '贵A·Q5182', amount: '396', status: '待出行', tone: 'upcoming' },
  { id: 'QX20260914022', name: '贵旅出行-黄果树一日包车', origin: '贵阳北站', destination: '黄果树景区', createdAt: '2026-09-14 20:42', tripTime: '2026-09-20 08:30-16:30', driver: '龙师傅', vehicleModel: '吉利曹操60', vehiclePlate: '贵A·K7286', amount: '580', status: '待付款', tone: 'pending' },
  { id: 'QX20260828016', name: '贵旅出行-青岩古镇半日游', origin: '贵阳市云岩区', destination: '青岩古镇', createdAt: '2026-08-26 18:12', tripTime: '2026-08-28 13:00-18:00', driver: '罗师傅', vehicleModel: '日产轩逸', vehiclePlate: '贵A·Q5182', amount: '396', status: '已完成', tone: 'done' },
  { id: 'QX20260811009', name: '贵旅出行-天河潭一日游', origin: '贵阳市观山湖区', destination: '天河潭旅游度假区', createdAt: '2026-08-09 10:26', tripTime: '2026-08-11 09:00-17:00', driver: '赵师傅', vehicleModel: '日产轩逸', vehiclePlate: '贵A·M6039', amount: '368', status: '退款/售后', tone: 'after-sale' },
]

const savedCards = [
  { name: '龙师傅', role: '贵旅出行·司机', lastMessage: '明天早上8:30，我到酒店大堂接您。', image: '/assets/yang-tonghai-avatar.png', tone: 'blue', saved: true, tags: [{ label: '商务7座', kind: 'vehicle' }, { label: '13年驾龄', kind: 'person' }, { label: '退伍老兵', kind: 'person' }], intro: INTRO },
  { name: '罗文静', role: '贵旅出行·司机', lastMessage: '青岩古镇下午出发更轻松。', image: '/assets/luo-wenjing-avatar.png', tone: 'violet', saved: false,
    tags: [{ label: '舒适5座', kind: 'vehicle' }, { label: '8年驾龄', kind: 'person' }, { label: '亲子向导', kind: 'person' }],
    intro: '乘客您好，我是罗文静，熟悉贵阳街巷、青岩古镇和周边亲子路线。提供机场接送、半日游和家庭包车服务，喜欢带大家逛老街、尝小吃。行程节奏可以按老人和孩子的体力调整，欢迎提前告诉我您的出行安排。',
    demoMessages: [
      { role: 'assistant', text: '这次想去哪里玩？告诉我出行时间、同行人数和孩子的年龄，我来帮您安排轻松的旅程。' },
      { role: 'user', text: '我们一家三口，孩子6岁，想明天下午去青岩古镇，时间不用太赶。' },
      { role: 'assistant', text: '可以安排半日慢游，下午从酒店接您。先逛石板老街，再找个地方尝小吃，中途留出休息时间。' },
      { role: 'user', text: '我们住在甲秀楼附近，想在古镇吃完晚饭再回来。' },
      { role: 'assistant', text: '好的，晚饭后送您回酒店。您把酒店名称和方便出发的时间发给我，我再确认接送安排。' },
    ] },
  { name: '赵明远', role: '贵旅出行·司机', lastMessage: '小七孔这两天天气很好，适合出行。', image: '/assets/zhao-mingyuan-avatar.png', tone: 'green', saved: false,
    tags: [{ label: '商务7座', kind: 'vehicle' }, { label: '10年驾龄', kind: 'person' }, { label: '山水向导', kind: 'person' }],
    intro: '乘客您好，我是赵明远，常跑荔波小七孔、黄果树和黔东南山水路线。提供长途接送、多日包车和沿途游览建议，熟悉山路与休息点。喜欢摄影，也愿意陪您慢慢看风景，路线和停留时间都可以提前商量。',
    demoMessages: [
      { role: 'assistant', text: '欢迎来贵州看山水！告诉我您的出发地点、游玩天数和同行人数，我来帮您规划路线。' },
      { role: 'user', text: '我们4个人，想从贵阳去小七孔玩两天，希望能多留些拍照时间。' },
      { role: 'assistant', text: '建议第一天前往荔波，途中适当休息；第二天早点进小七孔，把主要时间留给景区游览和拍照。' },
      { role: 'user', text: '有两位老人，步行太多会比较累，能安排轻松一些吗？' },
      { role: 'assistant', text: '可以，我会结合景区交通和大家的体力安排停留，减少来回走动。出发前再一起确认天气、接送地点和返程时间。' },
    ] },
]

function SystemStatusBar() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <div className="system-status" aria-label="系统状态栏">
      <span className="system-time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
      <div className="system-icons" aria-hidden="true">
        <CellSignalHighIcon weight="fill" />
        <WifiHighIcon weight="bold" />
        <BatteryHighIcon weight="fill" />
      </div>
    </div>
  )
}

function ChatDatePicker({ value, min, onChange }) {
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  useEffect(() => {
    if (!isOpen) return
    const shell = document.querySelector('.app-shell')
    const previousInert = shell.inert
    shell.inert = true
    dialogRef.current.querySelector('button').focus()
    return () => { shell.inert = previousInert; triggerRef.current?.focus() }
  }, [isOpen])
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') { event.stopPropagation(); setIsOpen(false) }
    if (event.key !== 'Tab') return
    const buttons = [...dialogRef.current.querySelectorAll('button:not(:disabled)')]
    const first = buttons[0], last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  const [draft, setDraft] = useState(value)
  const [month, setMonth] = useState(() => new Date(`${min}T00:00:00`))
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1).getDay()
  const days = new Date(year, monthIndex + 1, 0).getDate()
  const open = () => {
    setDraft(value)
    setMonth(new Date(`${value || min}T00:00:00`))
    setIsOpen(true)
  }
  return <>
    <button type="button" ref={triggerRef} className="chat-date-trigger" onClick={open} aria-haspopup="dialog">
      <span className="chat-field-label">出行日期</span>
      <span className={`chat-date-value ${value ? 'has-value' : ''}`}><strong>{value ? formatSelectedMonthDay(value) : '请选择'}</strong><CaretRightIcon /></span>
    </button>
    {isOpen && createPortal(<div className="chat-calendar-layer" onClick={(event) => { if (event.target === event.currentTarget) setIsOpen(false) }}>
    <section ref={dialogRef} className="chat-calendar-sheet" role="dialog" aria-modal="true" aria-labelledby="chat-calendar-title" onKeyDown={handleKeyDown}>
      <div className="chat-calendar-content">
        <div className="chat-sheet-handle" aria-hidden="true" />
        <header><button type="button" onClick={() => setIsOpen(false)}>取消</button><h2 id="chat-calendar-title">选择出行日期</h2><button type="button" disabled={!draft || draft < min} onClick={() => { onChange(draft); setIsOpen(false) }}>确定</button></header>
        <div className="chat-calendar-month"><button type="button" aria-label="上个月" disabled={formatLocalDate(new Date(year, monthIndex, 1)) <= min.slice(0, 7) + '-01'} onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}><ArrowLeftIcon /></button><strong>{year}年{monthIndex + 1}月</strong><button type="button" aria-label="下个月" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}><CaretRightIcon /></button></div>
        <div className="chat-calendar-grid">
          {['日', '一', '二', '三', '四', '五', '六'].map((day) => <span className="chat-calendar-weekday" key={day}>{day}</span>)}
          {Array.from({ length: firstDay }, (_, index) => <span key={`blank-${index}`} />)}
          {Array.from({ length: days }, (_, index) => {
            const date = formatLocalDate(new Date(year, monthIndex, index + 1))
            return <button type="button" key={date} disabled={date < min} aria-label={date} aria-pressed={draft === date} className={draft === date ? 'selected' : ''} onClick={() => setDraft(date)}>{index + 1}{date === min && <small>今天</small>}</button>
          })}
        </div>
      </div>
    </section></div>, document.body)}
  </>
}

function App() {
  const [shareOpen, setShareOpen] = useState(false)
  const [storeOpen, setStoreOpen] = useState(() => { const params = new URLSearchParams(location.search); return params.has('guide') && params.get('view') !== 'chat' })
  const [contact, setContact] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [navSolid, setNavSolid] = useState(false)
  const [detailNavSolid, setDetailNavSolid] = useState(false)
  const [accountPage, setAccountPage] = useState(null)
  const [profile, setProfile] = useState({ name: '林晓月', image: '/assets/visitor-lin-xiaoyue-avatar.png' })
  const [profileDraft, setProfileDraft] = useState({ name: '林晓月', image: '/assets/visitor-lin-xiaoyue-avatar.png' })
  const [orderFilter, setOrderFilter] = useState('全部')
  const [homeReturnPage, setHomeReturnPage] = useState(null)
  const [cardSearch, setCardSearch] = useState('')
  const [selectedGuide, setActiveGuide] = useState(() => savedCards.find(card => card.name === new URLSearchParams(location.search).get('guide')) || savedCards[0])
  const activeGuide = savedCards.find(card => card.name === selectedGuide.name) || savedCards[0]
  const [contactMessages, setContactMessages] = useState({})
  const [contactDraft, setContactDraft] = useState('')
  const [followedGuides, setFollowedGuides] = useState(new Set())
  const following = followedGuides.has(activeGuide.name)
  const toggleFollowing = () => setFollowedGuides(current => { const next = new Set(current); next.has(activeGuide.name) ? next.delete(activeGuide.name) : next.add(activeGuide.name); return next })
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [toast, setToast] = useState('')
  const [bookingOpen, setBookingOpen] = useState(false)
  const [booking, setBooking] = useState(createDefaultOrder)
  const visibleCards = savedCards.filter((card) => `${card.name}${card.role}${card.lastMessage}`.toLowerCase().includes(cardSearch.trim().toLowerCase()))
  const visibleOrders = orderFilter === '全部' ? orderSamples : orderSamples.filter((order) => order.status === orderFilter)
  const homeRef = useRef(null)
  const appRef = useRef(null)
  const [journeyModalOpen, setJourneyModalOpen] = useState(false)
  const [conversationEntry, setConversationEntry] = useState(0)
  useLayoutEffect(() => {
    homeRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    setNavSolid(false)
  }, [conversationEntry])
  const openContactCard = (card) => {
    setActiveGuide(card)
    setContactDraft('')
    setHomeReturnPage(drawerOpen ? null : '名片夹')
    setDrawerOpen(false)
    setAccountPage(null)
    setStoreOpen(false)
    setConversationEntry(current => current + 1)
  }
  const openConsultation = () => {
    setSelectedRoute(null)
    setBookingOpen(false)
    setStoreOpen(false)
    setContact(null)
    if (accountPage === '名片夹') setHomeReturnPage('名片夹')
    setAccountPage(null)
    setConversationEntry(current => current + 1)
  }
  const bookingDateOptions = getBookingDateOptions()
  const quickBookingDates = bookingDateOptions.map((option) => formatLocalDate(option.date))
  const isCustomBookingDate = !quickBookingDates.includes(booking.travelDate)

  useEffect(() => {
    document.body.style.overflow = drawerOpen || selectedRoute || accountPage ? 'hidden' : ''
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false)
        setStoreOpen(false)
        setAccountPage(null)
        setBookingOpen(false)
        setSelectedRoute(null)
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [drawerOpen, selectedRoute, accountPage])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!selectedRoute) setDetailNavSolid(false)
  }, [selectedRoute])

  const updateTravelerCount = (key, amount) => {
    setBooking((current) => ({ ...current, [key]: Math.max(0, Math.min(30, current[key] + amount)) }))
  }

  const startProfileEditing = () => {
    setProfileDraft(profile)
    setAccountPage('编辑资料')
  }
  const updateProfileAvatar = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setToast('请选择图片文件'); return }
    const reader = new FileReader()
    reader.onload = () => setProfileDraft((current) => ({ ...current, image: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  const renderContactCollection = (inDrawer = false) => (
    <div className="account-collection contact-collection">
              <label className="contact-search"><MagnifyingGlassIcon aria-hidden="true" /><input type="search" value={cardSearch} onChange={(event) => setCardSearch(event.target.value)} placeholder="搜索名片" aria-label="搜索名片" /></label>
              {visibleCards.map((card) => <article className="contact-card" key={card.name} onClick={() => openContactCard(card)}>
                <button className="contact-card-main" type="button" aria-label={`与${card.name}对话`}>
                  {card.image ? <img src={card.image} alt={card.name} /> : <span className={`contact-initial ${card.tone}`}>{card.initials}</span>}
                  <span className="contact-copy"><span className="contact-name"><strong>{card.name}</strong></span><span className="contact-role-tags"><small>贵旅出行</small><small>司机</small></span></span>
                </button>
                {!inDrawer && <button className="contact-profile-button" type="button" aria-label={`${card.name}的个人主页`} onClick={event => { event.stopPropagation(); setActiveGuide(card); setDrawerOpen(false); setStoreOpen(true) }}><HouseIcon aria-hidden="true" /></button>}
              </article>)}
              {!visibleCards.length && <p className="contact-empty">没有找到相关名片</p>}
            </div>
  )

  const renderGuideCard = (inProfile) => (
          <article className={`guide-card${inProfile ? '' : ' conversation-guide-card'}`} aria-labelledby={inProfile ? 'profile-guide-name' : 'guide-name'}>
            <div className="guide-topline">
              <div className="guide-avatar-wrap">
                <img className="guide-avatar" src={activeGuide.image} alt={`推荐官${activeGuide.name}`} />
              </div>
              <div className="guide-identity">
                <div className="guide-name-row">
                  <h1 id={inProfile ? 'profile-guide-name' : 'guide-name'}>{activeGuide.name}</h1>
                </div>
                {inProfile && <p className="guide-role">贵旅出行·文旅推荐官</p>}
                <div className="driver-info-tags" aria-label="车辆与服务信息">
                  {activeGuide.tags.map(tag => <span key={tag.label} data-kind={tag.kind}>{tag.label}</span>)}
                </div>
              </div>
              {inProfile && <button className="share-button profile-phone-button" type="button" aria-label={`电话联系${activeGuide.name}`} onClick={() => setContact({ kind: 'phone', context: activeGuide.name })}><PhoneIcon /></button>}
              {inProfile && <button className="share-button" type="button" onClick={() => setShareOpen(true)} aria-label="分享推荐官名片"><ShareNetworkIcon /></button>}
            </div>
            {inProfile ? <>
              <p className="guide-intro">跑遍黔山秀水，为你精选地道景点和美食</p>
              <div className="guide-contact-actions">
                <div className="guide-social-stats" aria-label="关注和分享统计"><div><strong>{following ? 69 : 68}</strong><span>被关注</span></div><div><strong>37</strong><span>被分享</span></div></div>
                <button className="guide-follow-button" type="button" aria-pressed={following} onClick={toggleFollowing}><HeartIcon weight={following ? 'fill' : 'regular'} />{following ? '已关注' : '关注'}</button>
              </div>
            </> : <>
              <div className="guide-corner-actions">
                <button type="button" aria-label={`${following ? '取消关注' : '关注'}${activeGuide.name}`} aria-pressed={following} onClick={toggleFollowing}><HeartIcon weight={following ? 'fill' : 'regular'} /></button>
              </div>
              <button className="guide-profile-link" type="button" onClick={() => setStoreOpen(true)}><IdentificationCardIcon aria-hidden="true" />{`去${activeGuide.name}主页查看更多信息`}<CaretRightIcon /></button>
            </>}
          </article>
  )

  return (
    <div ref={appRef} className={`app-shell${selectedRoute ? ' detail-active' : ''}${accountPage || storeOpen ? ' account-active' : ''}${bookingOpen ? ' booking-active' : ''}${navSolid ? ' nav-solid' : ''}${detailNavSolid ? ' detail-nav-solid' : ''}`}>
      <SystemStatusBar />
      <header inert={!!(storeOpen || selectedRoute || accountPage || drawerOpen || journeyModalOpen)} className={`home-fixed-header${navSolid ? ' solid' : ''}`}>
        <nav className="top-nav" aria-label="主导航">
          {homeReturnPage
            ? <button className="glass-button icon-button" type="button" onClick={() => { setAccountPage(homeReturnPage); setHomeReturnPage(null) }} aria-label={`返回${homeReturnPage}`}><ArrowLeftIcon weight="bold" /></button>
            : <button className="glass-button icon-button" type="button" onClick={() => setDrawerOpen(true)} aria-label="打开侧边栏"><ListIcon weight="bold" /></button>}
          <button type="button" className="compact-driver-title" aria-label={`查看${activeGuide.name}的个人主页`} aria-hidden={!navSolid} tabIndex={navSolid ? 0 : -1} onClick={() => setStoreOpen(true)}><img src={activeGuide.image} alt="" /><strong>{activeGuide.name}</strong></button>
        </nav>
      </header>
      <main className="home-screen" inert={!!(storeOpen || selectedRoute || accountPage || drawerOpen || journeyModalOpen)} ref={homeRef} onScroll={(event) => setNavSolid(event.currentTarget.scrollTop > 0)}>
        <div className="conversation-hero" aria-hidden="true" />

        <section className="content-flow">
          {renderGuideCard(false)}



          <div hidden={activeGuide.name !== '龙师傅'}><JourneyDemo hidden={activeGuide.name !== '龙师傅'} services={recommendations} onOpenService={product => { setSelectedRoute(product); setBookingOpen(false) }} appRef={appRef} homeRef={homeRef} suspended={!!(activeGuide.name !== '龙师傅' || storeOpen || selectedRoute || accountPage || drawerOpen || contact)} onModalChange={setJourneyModalOpen} /></div>
          {activeGuide.name !== '龙师傅' && <section className="journey-chat charter-chat" aria-label={`与${activeGuide.name}的出行对话`}><div className="chat-messages" role="log">{[{ role: 'assistant', text: activeGuide.intro }, ...activeGuide.demoMessages].map((message, index) => <div className="journey-message-wrap" key={`demo-${index}`}><article className={`chat-message ${message.role}`}><p>{message.text}</p></article>{index === 0 && <GuideServices services={recommendations} onOpen={product => { setSelectedRoute(product); setBookingOpen(false) }} />}</div>)}{(contactMessages[activeGuide.name] || []).map((text, index) => <article className="chat-message user" key={index}><p>{text}</p></article>)}</div></section>}
        </section>

      </main>

      {activeGuide.name !== '龙师傅' && <ConversationComposer key={activeGuide.name} input={contactDraft} setInput={setContactDraft} guideName={activeGuide.name} suspended={!!(storeOpen || selectedRoute || accountPage || drawerOpen || contact)} onSend={event => { event.preventDefault(); if (!contactDraft.trim()) return; setContactMessages(current => ({ ...current, [activeGuide.name]: [...(current[activeGuide.name] || []), contactDraft.trim()] })); setContactDraft(''); requestAnimationFrame(() => homeRef.current?.scrollTo({ top: homeRef.current.scrollHeight })); }} />}

      <div className={`drawer-layer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen} inert={!drawerOpen}>
        <button className="drawer-scrim" type="button" onClick={() => setDrawerOpen(false)} aria-label="关闭侧边栏" />
        <aside className="drawer" aria-label="侧边栏导航">
          <div className="drawer-header"><strong>虾片AI</strong></div>
          <div className="drawer-contacts">{renderContactCollection(true)}</div>
          <div className="drawer-footer">
            <button className="drawer-profile" type="button" aria-label="我的" onClick={() => { setDrawerOpen(false); setHomeReturnPage(null); setAccountPage('个人页') }}>
              <img src={profile.image} alt={`游客${profile.name}`} /><span><strong>{profile.name}</strong></span>
            </button>
            <button className="drawer-notifications" type="button" aria-label="通知"><BellIcon /></button>
          </div>
        </aside>
      </div>

      {accountPage && (
        <section className="account-page" inert={storeOpen} role="dialog" aria-modal="true" aria-label={accountPage}>
          <header className={accountPage === '编辑资料' ? 'profile-edit-header' : ''}>
            <button type="button" aria-label={['编辑资料', '我的订单'].includes(accountPage) ? '返回我的' : '返回侧边栏'} onClick={() => { if (['编辑资料', '我的订单'].includes(accountPage)) { setAccountPage('个人页'); return } setAccountPage(null); setDrawerOpen(true) }}><ArrowLeftIcon /></button>
            <h1>{accountPage === '个人页' ? '我的' : accountPage}</h1>
            {accountPage === '编辑资料' && <button className="profile-save-button" type="submit" form="profile-edit-form">保存</button>}
          </header>
          {accountPage === '个人页' ? <div className="my-page-content">
            <button className="my-profile-card" type="button" onClick={startProfileEditing} aria-label={`编辑${profile.name}的资料`}>
              <div className="my-avatar-wrap"><img src={profile.image} alt={profile.name} /></div>
              <div><h2>{profile.name}</h2><span>编辑资料</span></div>
              <CaretRightIcon aria-hidden="true" />
            </button>
            <section className="my-menu-card"><button type="button" onClick={() => setAccountPage('我的订单')}><ReceiptIcon /><span>我的订单</span><CaretRightIcon /></button></section>
            <section className="my-menu-card"><button type="button" onClick={() => setToast('已为你连接在线客服')}><HeadphonesIcon /><span>客服</span><CaretRightIcon /></button><button type="button" onClick={() => setToast('设置功能开发中')}><GearIcon /><span>设置</span><CaretRightIcon /></button></section>
            <button className="logout-button" type="button" onClick={() => setToast('已退出登录')}><SignOutIcon />退出登录</button>
          </div>
            : accountPage === '编辑资料' ? <form id="profile-edit-form" className="profile-edit-page" onSubmit={(event) => { event.preventDefault(); if (!profileDraft.name.trim()) { setToast('请输入昵称'); return } setProfile({ ...profileDraft, name: profileDraft.name.trim() }); setAccountPage('个人页'); setToast('资料已更新') }}>
              <label className="profile-avatar-editor" aria-label="更换头像">
                <span><img src={profileDraft.image} alt="头像预览" /><i><PencilSimpleIcon weight="bold" /></i></span>
                <input type="file" accept="image/*" onChange={updateProfileAvatar} />
              </label>
              <section className="profile-name-card">
                <label htmlFor="profile-name-input">昵称</label>
                <input id="profile-name-input" value={profileDraft.name} onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))} maxLength="12" autoComplete="nickname" />
              </section>
            </form>
            : accountPage === '我的订单' ? <div className="order-page-content">
              <nav className="order-tabs" aria-label="订单类型">{orderTabs.map((tab) => <button type="button" key={tab} aria-current={orderFilter === tab ? 'page' : undefined} onClick={() => setOrderFilter(tab)}>{tab}</button>)}</nav>
              <div className="account-collection order-collection">{visibleOrders.map((order) => <article className="order-card" key={order.id}>
                <header className="order-card-title"><strong>{order.name}</strong><span className={`record-status ${order.tone}`}>{order.status}</span></header>
                <dl className="order-detail-fields"><div><dt>出发</dt><dd>{order.origin}</dd></div><div><dt>到达</dt><dd>{order.destination}</dd></div><div><dt>下单时间</dt><dd>{order.createdAt}</dd></div></dl>
                <footer className="order-card-actions"><strong>￥{order.amount}</strong><div>{order.status !== '退款/售后' && order.status !== '待付款' && <button type="button" onClick={() => setToast('已进入退款/售后服务')}>退款/售后</button>}{order.status === '待付款' && <button className="primary-outline" type="button" onClick={() => setToast('已进入付款页面')}>去付款</button>}</div></footer>
              </article>)}{!visibleOrders.length && <p className="order-empty">暂无{orderFilter}订单</p>}</div>
            </div>
            : accountPage === '名片夹' ? renderContactCollection()
            : <div className="account-info"><h2>关于</h2><p>贵旅出行 · 文旅推荐官</p><p>版本 1.0</p></div>}
        </section>
      )}

      {storeOpen && <Storefront backgroundImage={activeGuide.name === '罗文静' ? '/assets/profile-terraces.jpg' : '/assets/profile-waterfall.jpg'} backgroundAlt={activeGuide.name === '罗文静' ? '云雾中的梯田与村落' : '群山绿树环绕的瀑布'} guideName={activeGuide.name} backLabel={accountPage === '名片夹' ? '返回名片夹' : '返回对话'} profileCard={renderGuideCard(true)} inactive={!!(selectedRoute || contact || shareOpen)} products={recommendations} onClose={() => setStoreOpen(false)} onOpen={product => { setSelectedRoute(product); setBookingOpen(false) }} />}
      {shareOpen && <ShareGuideSheet guide={activeGuide} onClose={() => setShareOpen(false)} />}
      {contact && <ContactSheet {...contact} onClose={() => setContact(null)} />}
      {selectedRoute && (
        <div className="route-detail-layer" role="dialog" aria-modal="true" aria-label={`${selectedRoute.name}详情`}>
          <main className="route-detail-screen">
            <header className={`route-detail-topbar${detailNavSolid ? ' solid' : ''}`}><button type="button" onClick={() => { setBookingOpen(false); setSelectedRoute(null); setDetailNavSolid(false) }} aria-label="返回"><ArrowLeftIcon /></button></header>
            <section className={`route-detail-scroll${selectedRoute.detailImage ? ' route-poster-detail' : ''}${selectedRoute.charter ? ' charter-detail-scroll' : ''}`} aria-label={`${selectedRoute.name}详情`} onScroll={(event) => setDetailNavSolid(event.currentTarget.scrollTop > 0)}>
              {selectedRoute.detailImage ? (
                <img className="route-poster-detail-image" src={selectedRoute.detailImage} alt={`${selectedRoute.name}详情长图`} />
              ) : <>
              <div className="route-detail-hero">
                <img src={selectedRoute.image} alt={`${selectedRoute.name}头图`} />
                <div className="route-detail-overlay" />
              </div>

              <section className="route-product-info">
                <h1 id="route-detail-title">{selectedRoute.name}</h1>
                <p>{selectedRoute.intro}</p>
              </section>

              {selectedRoute.charter ? (<>
                <section className="route-content-block route-charter-assurance">
                  <h2>服务描述</h2>
                  <ul className="route-service-list route-service-plain">{selectedRoute.serviceDetails.map((item) => {
                    const ServiceIcon = serviceDetailIcons[item.label]
                    return <li key={item.label}>
                      <span className="route-service-icon">{ServiceIcon && <ServiceIcon aria-hidden="true" />}</span>
                      <span className="route-service-copy"><strong>{item.label}</strong><p>{item.text}</p></span>
                    </li>
                  })}</ul>
                </section>
                <section className="route-content-block route-charter-section route-charter-notice">
                  <h2>下单须知</h2>
                  <ul className="route-notice-list">{selectedRoute.bookingNotices.map((item) => <li key={item}>{item}</li>)}</ul>
                </section>
                <section className="route-content-block route-charter-section route-charter-flow">
                  <h2>包车流程</h2>
                  <p className="route-booking-flow">{selectedRoute.bookingFlow.join('-')}</p>
                </section>
                <section className="route-content-block route-charter-section route-charter-pricing">
                  <h2>计费方式</h2>
                  <dl className="route-service-list">{selectedRoute.pricingMethods.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.text}</dd></div>)}</dl>
                </section>
              </>) : (
                <>
              <section className="route-content-block">
                <h2><SparkleIcon />行程特色</h2>
                <ul className="route-check-list">
                  {selectedRoute.features.map((feature) => <li key={feature}><CheckCircleIcon weight="fill" /><span>{feature}</span></li>)}
                </ul>
              </section>

              <section className="route-content-block">
                <h2><CalendarCheckIcon />行程速览</h2>
                <div className="route-itinerary-list">
                  {selectedRoute.details.map((detail) => (
                    <article key={`${detail.day}-${detail.city}`}>
                      <div className="route-itinerary-head"><strong>{detail.day}</strong><span>{detail.city}</span></div>
                      <dl>
                        <div><dt>景点</dt><dd>{detail.spots}</dd></div>
                        <div><dt>三餐</dt><dd>{detail.meals}</dd></div>
                        <div><dt>住宿</dt><dd>{detail.hotel}</dd></div>
                      </dl>
                      <p>{detail.text}</p>
                      <img src={selectedRoute.image} alt={`${selectedRoute.name}行程配图`} />
                    </article>
                  ))}
                </div>
              </section>

                </>
              )}

              {!selectedRoute.charter && <section className="route-content-block">
                <h2><img className="expense-title-icon" src="/assets/expense-center.svg" alt="" aria-hidden="true" />费用说明</h2>
                <div className="route-fee-groups">
                  <section className="route-fee-group included">
                    <h3><CheckCircleIcon weight="fill" />费用包含：</h3>
                    <dl className={selectedRoute.charter ? 'charter-fees' : undefined}>{selectedRoute.fees.included.map((fee) => <div key={fee.label}><dt>{fee.label}</dt><dd>{fee.text}</dd></div>)}</dl>
                  </section>
                  <section className="route-fee-group excluded">
                    <h3><XCircleIcon weight="fill" />费用不含：</h3>
                    <dl className={selectedRoute.charter ? 'charter-fees' : undefined}>{selectedRoute.fees.excluded.map((fee) => <div key={fee.label}><dt>{fee.label}</dt><dd>{fee.text}</dd></div>)}</dl>
                  </section>
                </div>
              </section>}
              </>}
            </section>

            {selectedRoute.detailImage && <footer className="route-bottom-cta route-poster-cta">
              <div className="route-reference-price"><span>参考价</span><strong>￥{selectedRoute.referencePrice}</strong></div>
              <button className="route-book-button" type="button" >定制咨询</button>
            </footer>}

            {!selectedRoute.detailImage && <footer className={`route-bottom-cta${selectedRoute.charter ? ' route-charter-cta' : ''}`}>
              <div className="route-detail-price">{selectedRoute.priceLabel ? <strong>{selectedRoute.priceLabel}</strong> : <><strong>￥{selectedRoute.price}</strong><span>/{selectedRoute.unit}</span></>}</div>
              {selectedRoute.charter && <button className="route-chat-button" type="button" onClick={() => openConsultation()}>聊一聊</button>}
              <button className="route-book-button" type="button" onClick={selectedRoute.charter ? () => setBookingOpen(true) : undefined}>{selectedRoute.charter ? '立即下单' : '定制咨询'}</button>
            </footer>}

            {!selectedRoute.detailImage && bookingOpen && (
              <div className="booking-sheet" role="dialog" aria-modal="true" aria-labelledby="booking-title">
                <button className="booking-backdrop" type="button" aria-label="关闭下单信息" onClick={() => setBookingOpen(false)} />
                <section className="booking-panel">
                  <div className="booking-handle" />
                  <h2 id="booking-title">立即下单</h2>
                  <div className="booking-form">
                    {selectedRoute.charter ? (
                      <div className="booking-contact-fields">
                        <label htmlFor="booking-phone"><span>手机号</span><input id="booking-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="请输入联系手机号" maxLength={11} value={booking.phone} onChange={(event) => setBooking((current) => ({ ...current, phone: event.target.value }))} /></label>
                        <label htmlFor="booking-pickup"><span>上车地点</span><input id="booking-pickup" type="text" placeholder="请输入酒店名称或详细上车地址" maxLength={120} value={booking.pickup} onChange={(event) => setBooking((current) => ({ ...current, pickup: event.target.value }))} /></label>
                      </div>
                    ) : (
                    <fieldset><legend>出行人数</legend><div className="traveler-grid">{[{ key: 'adults', label: '成人', hint: '18-64周岁' }, { key: 'children', label: '儿童', hint: '2-18周岁' }, { key: 'seniors', label: '老人', hint: '65周岁以上' }].map((traveler) => <label key={traveler.key}><span><strong>{traveler.label}</strong><small>{traveler.hint}</small></span><div className="traveler-stepper" aria-label={`${traveler.label}数量`}><button type="button" aria-label={`减少${traveler.label}人数`} onClick={() => updateTravelerCount(traveler.key, -1)} disabled={booking[traveler.key] === 0}>−</button><output>{booking[traveler.key]}</output><button type="button" aria-label={`增加${traveler.label}人数`} onClick={() => updateTravelerCount(traveler.key, 1)}>+</button></div></label>)}</div></fieldset>
                    )}
                  </div>
                  <div className="booking-action-bar"><div><strong>¥{(Number(selectedRoute.price) * (selectedRoute.unit === '天' ? 1 : booking.adults + booking.children + booking.seniors)).toLocaleString('zh-CN')}</strong></div><button type="button" onClick={() => { if (selectedRoute.charter && !/^1[3-9]\d{9}$/.test(booking.phone.trim())) { setToast('请输入正确的11位手机号'); return } if (selectedRoute.charter && !booking.pickup.trim()) { setToast('请填写上车地点'); return } setToast('信息已提交') }}>去支付</button></div>
                </section>
              </div>
            )}
          </main>
        </div>
      )}

      <div className="home-indicator" aria-hidden="true" />
      <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>
    </div>
  )
}

export default App
