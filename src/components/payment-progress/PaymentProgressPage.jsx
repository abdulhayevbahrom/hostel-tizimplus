import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, DatePicker, Empty, Input, Modal, Pagination, Select, Skeleton } from 'antd'
import { ArrowRightOutlined, CheckCircleOutlined, ClockCircleOutlined, InfoCircleOutlined, ReloadOutlined, SearchOutlined, WalletOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { apiErrorMessage, useGetPaymentProgressQuery } from '../../store/baseApi'
import { calculatePaymentProgress, splitDuration, summarizePaymentProgress } from '../../utils/paymentProgress'
import { AnimatedNumber } from './AnimatedNumber'
import './PaymentProgress.css'

const roomLabel = (room) => [room.block, room.floor != null && room.floor !== '' ? `${room.floor}-qavat` : null, `${room.roomNumber}-xona`].filter(Boolean).join(' · ')
const money = (amount) => Math.floor(amount).toLocaleString('uz-UZ')
const dateFormat = new Intl.DateTimeFormat('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' })
const date = (value) => {
  const parts = Object.fromEntries(dateFormat.formatToParts(new Date(value)).map(({ type, value: part }) => [type, part]))
  return `${parts.day}.${parts.month}.${parts.year}`
}
const statusLabels = { active: 'Oqlanmoqda', completed: 'To‘liq oqlandi', upcoming: 'Hali boshlanmagan', unpaid: 'To‘lov qilmagan' }
const statusOptions = [{ value: 'all', label: 'Barcha holatlar' }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))]
const currentPeriod = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit' }).format(new Date())

const countdownLabel = (row) => row.startsIn > 0 ? 'Boshlanishiga qoldi' : row.status === 'completed' ? 'To‘lov to‘liq oqlandi' : 'Oqlanishiga qolgan vaqt'
const countdownValue = (row) => row.startsIn > 0 ? row.startsIn : row.remainingTime

function PaymentPending() {
  return <div className="pp-payment-pending"><WalletOutlined /><div><strong>To‘lov kutilmoqda</strong><p>Vaqt hisobi to‘lov amalga oshirilgach ko‘rsatiladi.</p></div></div>
}

function Countdown({ value, compact = false }) {
  const parts = splitDuration(value)
  return <div className={`pp-countdown ${compact ? 'pp-countdown-compact' : ''}`} aria-label={`${parts.days} kun ${parts.hours} soat ${parts.minutes} minut ${parts.seconds} sekund`}>
    {Object.entries(parts).map(([key, number], index) => <div className="pp-time-unit" key={key}>
      <strong><AnimatedNumber value={String(number).padStart(2, '0')} /></strong><span>{['kun', 'soat', 'minut', 'sekund'][index]}</span>
    </div>)}
  </div>
}

function ProgressRing({ percent }) {
  const radius = 76
  const circumference = 2 * Math.PI * radius
  return <div className="pp-ring">
    <svg viewBox="0 0 184 184" aria-hidden="true">
      <circle cx="92" cy="92" r={radius} className="pp-ring-track" />
      <circle cx="92" cy="92" r={radius} className="pp-ring-value" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)} transform="rotate(-90 92 92)" />
    </svg>
    <div><strong><AnimatedNumber value={percent.toFixed(1)} /><small>%</small></strong><span>to‘lov oqlandi</span></div>
  </div>
}

function ProgressBar({ row }) {
  const total = Math.max(0, Number(row.amount) || 0)
  const paidPercent = total ? Math.min(100, row.paidAmount / total * 100) : 0
  const earnedPercent = total ? Math.min(paidPercent, row.earned / total * 100) : 0
  const debt = Math.max(0, total - row.paidAmount)
  return <>
    <div className="pp-bar pp-payment-bar" role="progressbar" aria-label="Davr summasidan oqlangan qism" aria-valuenow={Math.round(earnedPercent)} aria-valuemin={0} aria-valuemax={100}
      aria-valuetext={`${earnedPercent.toFixed(1)}% oqlandi, ${paidPercent.toFixed(1)}% to‘langan, ${money(debt)} so‘m to‘lanmagan`}>
      <span className="pp-segment-earned" style={{ width: `${earnedPercent}%` }} title={`Oqlandi: ${money(row.earned)} so‘m`} />
      <span className="pp-segment-prepaid" style={{ width: `${Math.max(0, paidPercent - earnedPercent)}%` }} title={`Hali oqlanmagan: ${money(row.remaining)} so‘m`} />
      <span className="pp-segment-unpaid" style={{ width: `${100 - paidPercent}%` }} title={`To‘lanmagan: ${money(debt)} so‘m`} />
      {paidPercent > 0 && paidPercent < 100 && <i className="pp-paid-boundary" style={{ left: `${paidPercent}%` }} aria-hidden="true" />}
    </div>
    <div className="pp-payment-legend"><span><i className="pp-legend-earned" />Oqlangan</span><span><i className="pp-legend-prepaid" />Hali oqlanmagan</span>{debt > 0 && <span><i className="pp-legend-unpaid" />To‘lanmagan</span>}</div>
    <div className="pp-coverage"><span>To‘langan: <b>{paidPercent.toFixed(1)}%</b> / <b>{money(total)}</b> so‘m</span>{debt > 0 && <span className="pp-unpaid-amount">Qarz: <b>{money(debt)}</b> so‘m</span>}</div>
  </>
}

function StudentCard({ row, onOpen }) {
  return <article className={`pp-student-card pp-${row.status}`}>
    <div className="pp-student-top">
      <div className="pp-avatar">{row.student.photo?.thumbnailUrl || row.student.photo?.url
        ? <img src={row.student.photo.thumbnailUrl || row.student.photo.url} alt="" loading="lazy" />
        : row.student.fullName?.split(' ').slice(0, 2).map((part) => part[0]).join('')}</div>
      <div className="pp-student-name"><h3>{row.student.fullName}</h3><span>{roomLabel(row.room)}</span></div>
      <span className={`pp-status pp-status-${row.status}`}><i />{statusLabels[row.status]}</span>
    </div>
    <div className="pp-card-amount"><span>To‘langan summa</span><strong><AnimatedNumber value={money(row.paidAmount)} /> <small>so‘m</small></strong></div>
    <div className="pp-progress-label"><span>Davr summasidan oqlandi</span><strong><AnimatedNumber value={(row.amount > 0 ? row.earned / row.amount * 100 : 0).toFixed(1)} />%</strong></div>
    <ProgressBar row={row} />
    <div className="pp-amount-pair">
      <div><span><i className="pp-dot pp-dot-earned" />Oqlandi</span><strong><AnimatedNumber value={money(row.earned)} /> <small>so‘m</small></strong></div>
      <div><span><i className="pp-dot pp-dot-remaining" />Qoldi</span><strong><AnimatedNumber value={money(row.remaining)} /> <small>so‘m</small></strong></div>
    </div>
    <div className="pp-card-time">
      {row.status === 'unpaid' ? <PaymentPending /> : <>
        <div className="pp-time-label"><ClockCircleOutlined /><span>{countdownLabel(row)}</span></div>
        <Countdown value={countdownValue(row)} compact />
      </>}
    </div>
    <button className="pp-card-footer" onClick={() => onOpen(row.id)}><span>{date(row.startDate)} — {date(row.status === 'unpaid' ? row.endDate : row.coveredUntil)}</span><span>Batafsil <ArrowRightOutlined /></span></button>
  </article>
}

export function PaymentProgressPage() {
  const [period, setPeriod] = useState(currentPeriod)
  const [clock, setClock] = useState(Date.now)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')
  const [room, setRoom] = useState('all')
  const [sort, setSort] = useState('remaining')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)
  const { data, isLoading, isFetching, error, refetch, fulfilledTimeStamp, currentData } = useGetPaymentProgressQuery(period, { pollingInterval: 60000, refetchOnFocus: true, refetchOnReconnect: true })
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const offset = data?.serverTime && fulfilledTimeStamp ? Date.parse(data.serverTime) - fulfilledTimeStamp : 0
  const now = clock + offset
  const rows = useMemo(() => (currentData?.rows || []).map((row) => calculatePaymentProgress(row, now)), [currentData, now])
  const summary = summarizePaymentProgress(rows)
  const percent = summary.paid ? summary.earned / summary.paid * 100 : 0
  const rooms = [...new Map(rows.map((row) => [row.room.id, { value: row.room.id, label: roomLabel(row.room) }])).values()]
    .sort((a, b) => a.label.localeCompare(b.label, 'uz', { numeric: true }))
  const filtered = rows.filter((row) => (paymentStatus === 'all' || row.paymentStatus === paymentStatus) && (status === 'all' || row.status === status) && (room === 'all' || row.room.id === room)
    && `${row.student.fullName} ${roomLabel(row.room)} ${row.contractNumber}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => sort === 'name' ? a.student.fullName.localeCompare(b.student.fullName, 'uz') : sort === 'percent' ? b.percent - a.percent : sort === 'ending' ? a.remainingTime - b.remainingTime : b.remaining - a.remaining)
  const filteredSummary = summarizePaymentProgress(filtered)
  const pageCount = 9
  const visiblePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageCount)))
  const selected = rows.find((row) => row.id === selectedId)
  const changeFilter = (setter) => (value) => { setter(value); setPage(1) }
  const loading = isLoading || (isFetching && !currentData)
  const resetFilters = () => { setSearch(''); setStatus('all'); setPaymentStatus('all'); setRoom('all'); setPage(1) }

  return <div className="pp-page">
    <div className="pp-heading">
      <div><div className="pp-eyebrow"><span />MOLIYAVIY NAZORAT</div><h1>To‘lov progressi</h1><p>Har bir o‘tgan lahza — oqlangan to‘lov.</p></div>
      <div className="pp-heading-actions"><span className="pp-live"><i />Jonli hisob</span><DatePicker picker="month" value={dayjs(`${period}-01`)} allowClear={false} format="MM / YYYY" aria-label="Hisoblash oyi" onChange={(value) => { if (value) { setPeriod(value.format('YYYY-MM')); setPage(1); setSelectedId(null) } }} /><Button icon={<ReloadOutlined spin={isFetching} />} aria-label="Ma’lumotlarni yangilash" onClick={refetch} disabled={isFetching} /></div>
    </div>
    {error && <Alert type="error" showIcon title="Ma’lumotlarni yuklab bo‘lmadi" description={apiErrorMessage(error)} action={<Button onClick={refetch}>Qayta urinish</Button>} />}
    {loading ? <div className="pp-loading"><Skeleton active paragraph={{ rows: 5 }} /><Skeleton active paragraph={{ rows: 8 }} /></div> : <>
      <section className="pp-overview" aria-label="Umumiy to‘lov progressi">
        <div className="pp-hero">
          <div className="pp-hero-content"><span className="pp-hero-kicker"><WalletOutlined /> TO‘LOVLAR HOLATI</span><h2>Pulingizning vaqt<br />bilan o‘lchangan qiymati.</h2><p>Tanlangan oyga tegishli to‘lovlar qancha oqlangani va qancha xizmat hali oldinda ekanini kuzating.</p><div className="pp-hero-total"><span>Jami to‘langan</span><strong><AnimatedNumber value={money(summary.paid)} /> <small>so‘m</small></strong></div></div>
          <div className="pp-hero-visual"><ProgressRing percent={percent} /><div className="pp-ring-legend"><span><i />Oqlangan</span><span><i />Qolgan</span></div></div>
        </div>
        <div className="pp-summary-stack">
          <div className="pp-summary-card"><div className="pp-stat-icon pp-icon-earned"><CheckCircleOutlined /></div><div><span>Oqlangan summa</span><strong><AnimatedNumber value={money(summary.earned)} /> <small>so‘m</small></strong><p>Ko‘rsatilgan turar joy xizmati</p></div><span className="pp-stat-percent"><AnimatedNumber value={percent.toFixed(1)} />%</span></div>
          <div className="pp-summary-card"><div className="pp-stat-icon pp-icon-remaining"><ClockCircleOutlined /></div><div><span>Hali oqlanmagan</span><strong><AnimatedNumber value={money(summary.remaining)} /> <small>so‘m</small></strong><p>Oldinda ko‘rsatiladigan xizmat</p></div><span className="pp-stat-percent"><AnimatedNumber value={(summary.paid ? 100 - percent : 0).toFixed(1)} />%</span></div>
          <div className="pp-summary-foot"><span><i className="pp-dot pp-dot-earned" /><strong>{summary.active}</strong> nafar · to‘lovi oqlanmoqda</span><span><CheckCircleOutlined /><strong>{summary.completed}</strong> nafar · to‘lovi oqlangan</span>{summary.unpaid > 0 && <span className="pp-unpaid-amount"><WalletOutlined /><strong>{summary.unpaid}</strong> nafar · to‘lov qilmagan</span>}{summary.upcoming > 0 && <span><ClockCircleOutlined /><strong>{summary.upcoming}</strong> nafar · hali boshlanmagan</span>}</div>
        </div>
      </section>
      <div className="pp-explainer"><InfoCircleOutlined /><p><strong>Qanday hisoblanadi?</strong> To‘langan pul yashalgan vaqtga mutanosib oqlanadi. Masalan, 30 kun uchun 1 200 000 so‘m to‘langan bo‘lsa, 10 kunda 400 000 so‘m oqlanadi, 800 000 so‘m qoladi.</p></div>
      <section className="pp-students-section" aria-label="Talabalar bo‘yicha progress">
        <div className="pp-section-heading"><div><h2>Talabalar kesimida <span>{filteredSummary.studentCount} talaba</span></h2><p>{filteredSummary.periodCount} ta to‘lov davri · Har bir talaba soni bir marta hisoblanadi.</p></div></div>
        <div className="pp-filters"><Input prefix={<SearchOutlined />} placeholder="Talaba, xona yoki shartnomani qidirish…" aria-label="Talabani qidirish" value={search} onChange={(event) => changeFilter(setSearch)(event.target.value)} allowClear /><Select aria-label="Xona bo‘yicha filtr" value={room} onChange={changeFilter(setRoom)} options={[{ value: 'all', label: 'Barcha xonalar' }, ...rooms]} showSearch optionFilterProp="label" /><Select aria-label="To‘langan summa bo‘yicha filtr" value={paymentStatus} onChange={changeFilter(setPaymentStatus)} options={[{ value: 'all', label: 'Barcha to‘lovlar' }, { value: 'paid', label: 'To‘liq to‘lagan' }, { value: 'partial', label: 'Qisman to‘lagan' }, { value: 'unpaid', label: 'To‘lamagan' }]} /><Select aria-label="Oqlanish holati bo‘yicha filtr" value={status} onChange={changeFilter(setStatus)} options={statusOptions} /><Select className="pp-sort-filter" aria-label="Saralash" value={sort} onChange={changeFilter(setSort)} options={[{ value: 'remaining', label: 'Qolgan summa bo‘yicha' }, { value: 'ending', label: 'Tugash vaqti bo‘yicha' }, { value: 'percent', label: 'Oqlangan foiz bo‘yicha' }, { value: 'name', label: 'Ism bo‘yicha' }]} /></div>
        {filtered.length ? <div className="pp-student-grid">{filtered.slice((visiblePage - 1) * pageCount, visiblePage * pageCount).map((row) => <StudentCard row={row} key={row.id} onOpen={setSelectedId} />)}</div>
          : <div className="pp-empty"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={rows.length ? 'Qidiruvga mos to‘lov topilmadi' : 'Bu oy uchun turar joy davrlari yo‘q'} />{rows.length > 0 && <Button onClick={resetFilters}>Filtrlarni tozalash</Button>}</div>}
        {filtered.length > pageCount && <Pagination className="pp-pagination" current={visiblePage} total={filtered.length} pageSize={pageCount} showSizeChanger={false} onChange={setPage} />}
      </section>
      <p className="pp-count-note"><InfoCircleOutlined /> Bu bo‘limda tanlangan oyga tegishli to‘lov davrlari, jumladan faol shartnomasi bor va hali to‘lov qilmagan talabalar ko‘rsatiladi. Dashboard esa tanlangan kundagi barcha faol yashovchilarni, to‘lov qilgan-qilmaganidan qat’i nazar sanaydi. Shu sababli sonlar farq qilishi mumkin.</p>
      <p className="pp-method-note"><InfoCircleOutlined /> Hisob shartnomadagi haqiqiy davr uzunligiga asoslanadi (oyiga qarab kunlar soni farq qiladi). Qisman to‘lov davr boshidan qoplanadi. Depozitlar, bekor qilingan va kelajak sanali to‘lovlar kiritilmaydi. Vaqt: Toshkent.</p>
    </>}
    <Modal open={Boolean(selected)} onCancel={() => setSelectedId(null)} footer={null} title="To‘lov tafsilotlari" width={660} className="pp-detail-modal">
      {selected && <div className="pp-detail"><div className="pp-detail-heading"><h2>{selected.student.fullName}</h2><p>{roomLabel(selected.room)} · Shartnoma: {selected.contractNumber}</p><span className={`pp-status pp-status-${selected.status}`}><i />{statusLabels[selected.status]}</span></div>
        <div className="pp-detail-money"><div><span>To‘langan</span><strong><AnimatedNumber value={money(selected.paidAmount)} /> so‘m</strong></div><div><span>Oqlangan</span><strong><AnimatedNumber value={money(selected.earned)} /> so‘m</strong></div><div><span>Qolgan</span><strong><AnimatedNumber value={money(selected.remaining)} /> so‘m</strong></div></div>
        <div className="pp-progress-label"><span>Davr summasidan oqlandi</span><strong><AnimatedNumber value={(selected.amount > 0 ? selected.earned / selected.amount * 100 : 0).toFixed(2)} />%</strong></div><ProgressBar row={selected} />
        {selected.status === 'unpaid' ? <PaymentPending /> : <div className="pp-detail-clocks"><div><h4>Oqlangan vaqt</h4><Countdown value={selected.elapsed} /></div><div><h4>{countdownLabel(selected)}</h4><Countdown value={countdownValue(selected)} /></div></div>}
        <dl className="pp-detail-facts"><div><dt>Hisob davri</dt><dd>{date(selected.startDate)} — {date(selected.endDate)}</dd></div><div><dt>Davr uchun belgilangan summa</dt><dd><AnimatedNumber value={money(selected.amount)} /> so‘m</dd></div><div><dt>To‘lov qoplaydigan muddat oxiri</dt><dd>{selected.status === 'unpaid' ? 'To‘lov mavjud emas' : new Intl.DateTimeFormat('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(selected.coveredUntil))}</dd></div><div><dt>To‘lov turi</dt><dd>{selected.paymentType === 'daily' ? 'Kunlik' : 'Oylik'}</dd></div></dl>
        <p className="pp-detail-note">Oqlangan summa = davr summasi × yashalgan vaqt ÷ davr davomiyligi. Natija amalda to‘langan summadan oshmaydi. Summalar butun so‘mda ko‘rsatiladi.</p>
      </div>}
    </Modal>
  </div>
}
