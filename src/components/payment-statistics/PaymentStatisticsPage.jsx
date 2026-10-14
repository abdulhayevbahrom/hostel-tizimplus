import { useDeferredValue, useMemo, useState } from 'react'
import { DatePicker, Input, Modal, Pagination, Select } from 'antd'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { apiErrorMessage, useGetPaymentBehaviorQuery, useGetPaymentStatisticsQuery, useGetPaymentStatisticsRoomQuery } from '../../store/baseApi'
import './PaymentStatistics.css'
import './PaymentStatisticsModal.css'
import './PaymentStatisticsModalTitle.css'
import './PaymentStatisticsModalColumns.css'
import './PaymentStatisticsPaymentCell.css'
import './PaymentStatisticsSeparateColumns.css'
import './PaymentStatisticsFloorModal.css'
import './PaymentStatisticsMetricTabs.css'
import './PaymentStatisticsNote.css'
import './PaymentStatisticsStudentColumns.css'
import './PaymentStatisticsPagination.css'
import './PaymentStatisticsLocationFilters.css'
import './PaymentStatisticsFetching.css'
import './PaymentStatisticsThreeMetrics.css'
import './PaymentStatisticsControls.css'
import './PaymentStatisticsStudentsMobile.css'

const amount = (value) => Number(value || 0).toLocaleString('uz-UZ')
const money = (value) => `${amount(value)} so‘m`
const statusLabels = { onTime: 'Vaqtida', late: 'Kechikkan', pending: 'Kutilmoqda' }
const behaviorLabels = { onTime: 'Vaqtida', almostOnTime: 'Deyarli vaqtida', late: 'Kechiktiradi', insufficient: 'To‘lovlar yetarli emas' }

function DonutChart({ summary, metric }) {
  const timingSegments = [
    { key: 'onTime', value: summary?.onTimeCount || 0, color: '#2f8c7e' },
    { key: 'late', value: summary?.lateCount || 0, color: '#d26558' },
    { key: 'pending', value: summary?.pendingCount || 0, color: '#d5a147' },
  ]
  const paymentSegments = [
    { key: 'made', value: summary?.paidCount || 0, color: '#2f8c7e' },
    { key: 'notMade', value: summary?.remainingCount || 0, color: '#d26558' },
  ]
  const behaviorSegments = [{ key: 'onTime', value: summary?.onTimeBehaviorCount || 0, color: '#2f8c7e' }, { key: 'almostOnTime', value: summary?.almostOnTimeCount || 0, color: '#5f9fc7' }, { key: 'late', value: summary?.lateBehaviorCount || 0, color: '#d26558' }, { key: 'insufficient', value: summary?.insufficientCount || 0, color: '#d5a147' }]
  const segments = metric === 'payment' ? paymentSegments : metric === 'behavior' ? behaviorSegments : timingSegments
  const labels = metric === 'payment' ? { made: 'To‘liq to‘lagan', notMade: 'To‘lovi qolgan' } : metric === 'behavior' ? behaviorLabels : statusLabels
  const total = Math.max(1, segments.reduce((sum, item) => sum + item.value, 0))
  let offset = 0
  return <div className="ps-donut-wrap">
    <div className="ps-donut">
      <svg viewBox="0 0 120 120" role="img" aria-label="To‘lov holatlari diagrammasi">
        <circle className="track" cx="60" cy="60" r="48" />
        {segments.map((segment) => {
          const length = (segment.value / total) * 301.59
          const circle = <circle key={segment.key} cx="60" cy="60" r="48" stroke={segment.color} strokeDasharray={`${length} ${301.59 - length}`} strokeDashoffset={-offset} />
          offset += length
          return circle
        })}
      </svg>
      <div><strong>{metric === 'behavior' ? summary?.totalCount || 0 : summary?.studentCount || 0}</strong><span>talaba</span></div>
    </div>
    <div className="ps-legend">
      {segments.map((segment) => <p key={segment.key}><i style={{ background: segment.color }} /><span>{labels[segment.key]}</span><b>{segment.value}</b><small>{Math.round((segment.value / total) * 100)}%</small></p>)}
    </div>
  </div>
}

function GroupChart({ rows, view, metric, behaviorScope, onSelect }) {
  const isFloorView = view === 'floors'
  const isPaymentMetric = metric === 'payment'
  const isBehavior = metric === 'behavior'
  const behaviorUnit = isFloorView && behaviorScope === 'rooms' ? 'xona' : 'talaba'
  return <section className="ps-chart-card">
    <header><div><h2>{isFloorView ? 'Qavatlar bo‘yicha' : 'Xonalar bo‘yicha'}</h2><p>{isBehavior ? `Oxirgi 6 ta muddati kelgan davr bo‘yicha ${behaviorUnit}lar to‘lov odati` : isPaymentMetric ? (isFloorView ? 'To‘liq yopilgan va to‘lovi qolgan xonalar' : 'To‘liq to‘lagan va to‘lovi qolgan talabalar') : (isFloorView ? 'Vaqtida va kechikayotgan xonalar' : 'Vaqtida va kechiktirgan talabalar')}</p></div><div className="ps-chart-legend"><span className="onTime">{isBehavior ? 'Vaqtida' : isPaymentMetric ? 'To‘liq to‘langan' : 'Vaqtida'}</span>{isBehavior && <span className="almostOnTime">Deyarli vaqtida</span>}<span className="late">{isBehavior ? 'Kechiktiradi' : isPaymentMetric ? 'To‘lovi qolgan' : 'Kechiktirilgan'}</span>{!isPaymentMetric && <span className="pending">{isBehavior ? 'To‘lovlar yetarli emas' : 'Muddati kelmagan'}</span>}</div></header>
    <div className="ps-disk-grid">
      {rows.map((row) => {
        const behaviorSummary = isBehavior && isFloorView && behaviorScope === 'rooms' ? row.roomBehavior : row
        const total = Math.max(1, isBehavior ? behaviorSummary?.totalCount || 0 : isFloorView ? row.roomCount : row.studentCount)
        const greenCount = isBehavior ? behaviorSummary?.onTimeBehaviorCount || 0 : isPaymentMetric ? (isFloorView ? row.paidRoomCount : row.paidCount) : (isFloorView ? row.onTimeRoomCount : row.onTimeCount)
        const almostCount = isBehavior ? behaviorSummary?.almostOnTimeCount || 0 : 0
        const redCount = isBehavior ? behaviorSummary?.lateBehaviorCount || 0 : isPaymentMetric ? (isFloorView ? row.remainingRoomCount : row.remainingCount) : (isFloorView ? row.lateRoomCount : row.lateCount)
        const pendingCount = isBehavior ? behaviorSummary?.insufficientCount || 0 : isPaymentMetric ? 0 : (isFloorView ? row.pendingRoomCount : row.pendingCount)
        const behaviorTotalCount = behaviorSummary?.totalCount || 0
        const behaviorOnTimePercent = behaviorTotalCount ? Math.round((greenCount / behaviorTotalCount) * 100) : null
        const green = (greenCount / total) * 100
        const almost = (almostCount / total) * 100
        const red = (redCount / total) * 100
        const label = isFloorView ? `${row.block ? `${row.block} · ` : ''}${row.floor}-qavat` : `${row.room.block ? `${row.room.block} · ` : ''}${row.room.roomNumber}-xona`
        return <article className={`ps-disk-card ${isBehavior ? '' : 'clickable'}`} key={isFloorView ? `${row.block}-${row.floor}` : row.room.id} onClick={() => !isBehavior && onSelect(row)} role={isBehavior ? undefined : 'button'} tabIndex={isBehavior ? undefined : 0} onKeyDown={(event) => { if (!isBehavior && (event.key === 'Enter' || event.key === ' ')) onSelect(row) }}>
          <div className="ps-mini-donut" style={{ background: isBehavior ? `conic-gradient(#2f8c7e 0 ${green}%, #5f9fc7 ${green}% ${green + almost}%, #d26558 ${green + almost}% ${green + almost + red}%, #d5a147 ${green + almost + red}% 100%)` : `conic-gradient(#2f8c7e 0 ${green}%, #d26558 ${green}% ${green + red}%, #d5a147 ${green + red}% 100%)` }}>
            <div><strong>{isBehavior ? behaviorOnTimePercent == null ? '—' : `${behaviorOnTimePercent}%` : greenCount + redCount ? `${Math.round((greenCount / (greenCount + redCount)) * 100)}%` : '—'}</strong><span>{isBehavior ? `${behaviorUnit}lar ichida` : isPaymentMetric ? 'to‘liq to‘langan' : 'vaqtida'}</span></div>
          </div>
          <div className="ps-disk-info"><h3>{label}</h3>{view === 'rooms' && <p>{row.room.floor}-qavat · {row.studentCount} talaba</p>}{isFloorView && <p>{row.roomCount} ta xona · {row.studentCount || 0} ta talaba</p>}
            <ul><li className="onTime" style={{ position: 'relative' }}><span>{isBehavior ? `Vaqtida (${behaviorUnit})` : isPaymentMetric ? 'To‘liq to‘langan' : 'Vaqtida'}</span><b>{greenCount}</b></li>{isBehavior && <li className="almostOnTime" style={{ position: 'relative' }}><span>Deyarli vaqtida</span><b>{almostCount}</b></li>}<li className="late" style={{ position: 'relative' }}><span>{isBehavior ? 'Kechiktiradi' : isPaymentMetric ? 'To‘lovi qolgan' : 'Kechiktirilgan'}</span><b>{redCount}</b></li>{!isPaymentMetric && <li className="pending" style={{ position: 'relative' }}><span>{isBehavior ? 'To‘lovlar yetarli emas' : 'Muddati kelmagan'}</span><b>{pendingCount}</b></li>}</ul>
          </div>
        </article>
      })}
    </div>
    {!rows.length && <div className="ps-empty">Tanlangan oy uchun ma’lumot topilmadi</div>}
  </section>
}

export function PaymentStatisticsPage() {
  const [period, setPeriod] = useState(dayjs().format('YYYY-MM'))
  const [view, setView] = useState('floors')
  const [metric, setMetric] = useState('payment')
  const [behaviorScope, setBehaviorScope] = useState('students')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [floorFilter, setFloorFilter] = useState('')
  const [roomFilter, setRoomFilter] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [studentPage, setStudentPage] = useState(1)
  const navigate = useNavigate()
  const deferredSearch = useDeferredValue(search.trim())
  const requestParams = { period, search: deferredSearch || undefined, page: studentPage, metric, status, floor: floorFilter || undefined, room: roomFilter || undefined }
  const statisticsQuery = useGetPaymentStatisticsQuery(requestParams, { skip: metric === 'behavior' })
  const behaviorQuery = useGetPaymentBehaviorQuery(requestParams, { skip: metric !== 'behavior' })
  const query = metric === 'behavior' ? behaviorQuery : statisticsQuery
  const data = query.data
  const roomDetailsQuery = useGetPaymentStatisticsRoomQuery({ roomId: selectedRoom?.room?.id, period }, { skip: !selectedRoom?.room?.id })
  const rows = useMemo(() => {
    if (!data) return []
    if (view === 'rooms') return [...(data.rooms || [])].sort((a, b) => (
      String(a.room.block || '').localeCompare(String(b.room.block || ''), 'uz', { numeric: true, sensitivity: 'base' })
      || String(a.room.floor || '').localeCompare(String(b.room.floor || ''), 'uz', { numeric: true, sensitivity: 'base' })
      || String(a.room.roomNumber || '').localeCompare(String(b.room.roomNumber || ''), 'uz', { numeric: true, sensitivity: 'base' })
    ))
    if (view !== 'students') return data[view] || []
    return data.studentResults || []
  }, [data, view])
  const summary = data?.summary
  const selectedRoomStudents = roomDetailsQuery.data?.students || []
  const selectedFloorRooms = useMemo(() => selectedFloor ? (data?.rooms || [])
    .filter((row) => (row.room.block || '') === selectedFloor.block && row.room.floor === selectedFloor.floor)
    .sort((a, b) => String(a.room.roomNumber).localeCompare(String(b.room.roomNumber), 'uz', { numeric: true, sensitivity: 'base' })) : [], [data?.rooms, selectedFloor])
  const floorOptions = useMemo(() => [...new Set((data?.rooms || []).map((row) => row.room.floor).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), 'uz', { numeric: true, sensitivity: 'base' }))
    .map((floor) => ({ value: floor, label: `${floor}-qavat` })), [data?.rooms])
  const roomOptions = useMemo(() => (data?.rooms || []).filter((row) => !floorFilter || row.room.floor === floorFilter)
    .sort((a, b) => String(a.room.roomNumber).localeCompare(String(b.room.roomNumber), 'uz', { numeric: true, sensitivity: 'base' }))
    .map((row) => ({ value: row.room.id, label: `${row.room.block ? `${row.room.block} · ` : ''}${row.room.floor}-qavat · ${row.room.roomNumber}-xona` })), [data?.rooms, floorFilter])

  return (
    <div className="payment-statistics-page">
      <header className="ps-toolbar">
        <div><h1>To‘lov statistikasi</h1><p>Qavat, xona va talabalar kesimida to‘lov intizomi</p></div>
        <DatePicker picker="month" allowClear={false} value={dayjs(`${period}-01`)} format="MMMM, YYYY" onChange={(value) => { setPeriod(value.format('YYYY-MM')); setStudentPage(1) }} />
      </header>

      {query.isLoading ? <div className="ps-state"><span />Statistika hisoblanmoqda...</div>
        : query.isError ? <div className="ps-state error"><b>{apiErrorMessage(query.error)}</b><button onClick={query.refetch}>Qayta urinish</button></div>
          : <>
            <section className="ps-overview">
              <article className="ps-overview-card"><header><h2>{metric === 'payment' ? 'To‘liq to‘lagan / to‘lovi qolgan' : metric === 'behavior' ? 'Tarixiy to‘lov odati' : 'Vaqtida / kechiktirilgan'}</h2><span>{metric === 'behavior' ? 'Oxirgi 6 davr' : period}</span></header><DonutChart summary={summary} metric={metric} /></article>
              {metric === 'behavior' ? <article className="ps-overview-card ps-money-chart"><header><h2>Tarixiy intizom</h2><span>Kamida 3 davr</span></header><div className="ps-money-values"><div><span>Baholangan davrlar</span><strong>{summary?.evaluatedPeriods || 0}</strong></div><div><span>Vaqtida to‘langan</span><strong>{summary?.onTimeCount || 0}</strong></div></div><div className="ps-money-track"><i style={{ width: `${summary?.onTimeRate || 0}%` }} /></div><div className="ps-money-footer"><p><span>Umumiy intizom</span><b>{summary?.onTimeRate == null ? '—' : `${summary.onTimeRate}%`}</b></p><p><span>Kechiktirilgan</span><b>{summary?.lateCount || 0}</b></p></div></article> : <article className="ps-overview-card ps-money-chart"><header><h2>Reja va tushum</h2><span>{summary?.scheduledAmount ? Math.round((summary.paidAmount / summary.scheduledAmount) * 100) : 0}% bajarildi</span></header>
                <div className="ps-money-values"><div><span>To‘langan</span><strong>{money(summary?.paidAmount)}</strong></div><div><span>Rejalashtirilgan</span><strong>{money(summary?.scheduledAmount)}</strong></div></div>
                <div className="ps-money-track"><i style={{ width: `${Math.min(100, summary?.scheduledAmount ? (summary.paidAmount / summary.scheduledAmount) * 100 : 0)}%` }} /></div>
                <div className="ps-money-footer"><p><span>Vaqtida to‘lash</span><b>{summary?.onTimeRate == null ? '—' : `${summary.onTimeRate}%`}</b></p><p><span>Qarzdorlik</span><b>{money(summary?.debtAmount)}</b></p></div>
              </article>}
            </section>

            <section className="ps-controls" aria-label="Statistika boshqaruvi">
              <div className="ps-control-row">
                <span className="ps-control-label">Ko‘rinish</span>
                <nav className="ps-tabs" aria-label="Statistika kesimi">
                  <button className={view === 'floors' ? 'active' : ''} onClick={() => { setView('floors'); setStudentPage(1) }}>Qavatlar</button>
                  <button className={view === 'rooms' ? 'active' : ''} onClick={() => { setView('rooms'); setStudentPage(1) }}>Xonalar</button>
                  <button className={view === 'students' ? 'active' : ''} onClick={() => { setView('students'); setStudentPage(1) }}>Talabalar</button>
                </nav>
              </div>
              <div className="ps-control-row">
                <span className="ps-control-label">Ko‘rsatkich</span>
                <nav className="ps-metric-tabs" aria-label="Statistika turi">
                  <button className={metric === 'payment' ? 'active' : ''} onClick={() => { setMetric('payment'); setStatus('all'); setStudentPage(1) }}>To‘lov holati</button>
                  <button className={metric === 'timing' ? 'active' : ''} onClick={() => { setMetric('timing'); setStatus('all'); setStudentPage(1) }}>Muddat intizomi</button>
                  <button className={metric === 'behavior' ? 'active' : ''} onClick={() => { setMetric('behavior'); setStatus('all'); setStudentPage(1) }}>Tarixiy to‘lov odati</button>
                </nav>
              </div>
              {metric === 'behavior' && view === 'floors' && <div className="ps-control-row">
                <span className="ps-control-label">Hisoblash kesimi</span>
                <nav className="ps-behavior-scope" aria-label="Qavat statistikasi kesimi">
                  <button className={behaviorScope === 'students' ? 'active' : ''} onClick={() => setBehaviorScope('students')}>Talabalar</button>
                  <button className={behaviorScope === 'rooms' ? 'active' : ''} onClick={() => setBehaviorScope('rooms')}>Xonalar</button>
                </nav>
              </div>}
            </section>

            {view === 'students' && <div className="ps-filters">
              <Input.Search allowClear placeholder="Talaba, telefon yoki xona..." value={search} onChange={(event) => { setSearch(event.target.value); setStudentPage(1) }} />
              <Select allowClear placeholder="Qavat" value={floorFilter || undefined} options={floorOptions} onChange={(value = '') => { setFloorFilter(value); setRoomFilter(''); setStudentPage(1) }} />
              <Select allowClear showSearch optionFilterProp="label" placeholder="Xona" value={roomFilter || undefined} options={roomOptions} onChange={(value = '') => { setRoomFilter(value); setStudentPage(1) }} />
              <Select value={status} onChange={(value) => { setStatus(value); setStudentPage(1) }} options={metric === 'payment' ? [{ value: 'all', label: 'Barcha holatlar' }, { value: 'made', label: 'To‘liq to‘lagan' }, { value: 'notMade', label: 'To‘lovi qolgan' }] : metric === 'behavior' ? [{ value: 'all', label: 'Barcha odatlar' }, { value: 'onTime', label: 'Vaqtida' }, { value: 'almostOnTime', label: 'Deyarli vaqtida' }, { value: 'late', label: 'Kechiktiradi' }, { value: 'insufficient', label: 'To‘lovlar yetarli emas' }] : [{ value: 'all', label: 'Barcha holatlar' }, { value: 'onTime', label: 'Vaqtida' }, { value: 'late', label: 'Kechiktirilgan' }, { value: 'pending', label: 'Muddati kelmagan' }]} />
            </div>}

            {metric === 'timing' && <div className="ps-stat-note"><strong>Eslatma:</strong> Bu ko‘rsatkichlar faqat to‘lov muddati kelganlar ichida hisoblanadi. Muddati kelmaganlar foizga qo‘shilmaydi.</div>}
            {metric === 'behavior' && <div className="ps-stat-note"><strong>Eslatma:</strong> To‘lov odati oxirgi 6 ta muddati kelgan davr bo‘yicha baholanadi. Ishonchli baho uchun kamida 3 ta davr kerak.</div>}

            <div className="ps-results-wrap">
              {query.isFetching && <div className="ps-fetching-overlay"><span />Ma’lumotlar yuklanmoqda...</div>}
            {view !== 'students' ? <GroupChart rows={rows} view={view} metric={metric} behaviorScope={behaviorScope} onSelect={view === 'floors' ? setSelectedFloor : setSelectedRoom} /> : <section className="ps-table-card">
              <div className="ps-table-scroll"><table className={`ps-students-table ${metric}`}><thead><tr>
                <th>#</th><th>{view === 'floors' ? 'Qavat' : view === 'rooms' ? 'Xona' : 'Talaba'}</th>
                {view === 'students' ? metric === 'behavior' ? <><th>Joylashuv</th><th>Davrlar</th><th>Vaqtida</th><th>Kechikkan</th><th>Foiz</th><th>To‘lov odati</th></> : <><th>Joylashuv</th><th>Reja</th><th>To‘langan</th><th>Qarz</th><th>Muddat</th><th>{metric === 'payment' ? 'To‘lov holati' : 'Muddat holati'}</th></> : <><th>Talabalar</th><th>Vaqtida</th><th>Kechikkan</th><th>Kutilmoqda</th><th>Ko‘rsatkich</th><th>Natija</th></>}
              </tr></thead><tbody>
                {rows.map((row, index) => (
                  <tr key={row.installmentId} className="ps-student-row" onClick={() => navigate(`/student/${row.student.id}`)}>
                    <td>{((studentPage - 1) * 25) + index + 1}</td><td><b>{row.student.fullName}</b><small>{row.student.phone}</small></td><td>{row.room.block ? `${row.room.block} · ` : ''}{row.room.floor}-qavat · {row.room.roomNumber}-xona</td>{metric === 'behavior' ? <><td className="ps-student-money">{row.evaluatedPeriods}</td><td className="ps-student-money paid">{row.onTimeCount}</td><td className="ps-student-money debt">{row.lateCount}</td><td className="ps-student-money">{row.onTimeRate}%</td><td><span className={`ps-status ${row.behavior === 'onTime' ? 'onTime' : row.behavior === 'almostOnTime' ? 'almostOnTime' : row.behavior === 'late' ? 'late' : 'pending'}`}>{behaviorLabels[row.behavior]}</span></td></> : <><td className="ps-student-money plan">{amount(row.amount)}</td><td className="ps-student-money paid">{amount(row.paidAmount)}</td><td className="ps-student-money debt">{amount(row.debtAmount)}</td><td>{dayjs(row.dueDate).format('DD.MM.YYYY')}</td><td>{metric === 'payment' ? <span className={`ps-status ${row.debtAmount <= 0 ? 'onTime' : 'late'}`}>{row.debtAmount <= 0 ? 'To‘liq to‘lagan' : 'To‘lovi qolgan'}</span> : <span className={`ps-status ${row.paymentStatus}`}>{statusLabels[row.paymentStatus]}</span>}</td></>}
                  </tr>
                ))}
              </tbody></table></div>
              {!rows.length && <div className="ps-empty">Tanlangan oy uchun ma’lumot topilmadi</div>}
              {(data?.pagination?.total || 0) > 25 && <div className="ps-pagination"><span>Jami: {data.pagination.total} ta</span><Pagination current={studentPage} pageSize={25} total={data.pagination.total} showSizeChanger={false} onChange={setStudentPage} /></div>}
            </section>}
            </div>
            <Modal className="ps-room-modal ps-floor-modal" open={Boolean(selectedFloor)} onCancel={() => setSelectedFloor(null)} footer={null} width={920} closable={false} title={selectedFloor ? <div className="ps-modal-title"><span>{selectedFloor.block ? `${selectedFloor.block} · ` : ''}{selectedFloor.floor}-qavat xonalari</span><button type="button" onClick={() => setSelectedFloor(null)} aria-label="Oynani yopish">×</button></div> : ''}>
              {selectedFloor && <><div className="ps-modal-summary"><span>{selectedFloor.roomCount} ta xona</span><b>{selectedFloor.paidRoomCount} ta yopilgan</b><em>{selectedFloor.remainingRoomCount} ta to‘lov qolgan</em></div><div className="ps-floor-list"><div className="ps-floor-head"><span>Xona</span><span>Talabalar</span><span>To‘landi</span><span>Reja</span><span>Qarz</span><span>Holat</span></div>{selectedFloorRooms.map((roomRow) => <button type="button" key={roomRow.room.id} onClick={() => { setSelectedFloor(null); setSelectedRoom(roomRow) }}><strong>{roomRow.room.roomNumber}-xona</strong><span>{roomRow.studentCount}</span><span className="paid">{amount(roomRow.paidAmount)}</span><span>{amount(roomRow.scheduledAmount)}</span><span className="debt">{amount(roomRow.debtAmount)}</span><em className={roomRow.debtAmount <= 0 ? 'closed' : 'remaining'}>{roomRow.debtAmount <= 0 ? 'Yopilgan' : 'Qolgan'}</em></button>)}</div></>}
            </Modal>
            <Modal className="ps-room-modal" open={Boolean(selectedRoom)} onCancel={() => setSelectedRoom(null)} footer={null} width={1040} closable={false} title={selectedRoom ? <div className="ps-modal-title"><span>{selectedRoom.room.roomNumber}-xona to‘lov holati</span><button type="button" onClick={() => setSelectedRoom(null)} aria-label="Oynani yopish">×</button></div> : ''}>
              {selectedRoom && <>
                <div className="ps-modal-summary"><span>{selectedRoom.room.block || 'Bloksiz'} · {selectedRoom.room.floor}-qavat</span><b>{selectedRoom.studentCount} talaba</b><em>{selectedRoom.onTimeRate == null ? 'Baholanmagan' : `${selectedRoom.onTimeRate}% vaqtida`}</em></div>
                <div className="ps-modal-list">
                  <div className="ps-modal-columns ps-payment-columns"><span>№</span><span>Talaba</span><span>To‘landi</span><span>Reja</span><span>Qarz</span><span>To‘lov muddati</span><span>Holat</span></div>
                  {roomDetailsQuery.isLoading && <div className="ps-empty">Talabalar yuklanmoqda...</div>}
                  {selectedRoomStudents.map((row, index) => <button type="button" key={row.installmentId} onClick={() => navigate(`/student/${row.student.id}`)}>
                    <i>{index + 1}</i><div><strong>{row.student.fullName}</strong><small>{row.student.phone || 'Telefon kiritilmagan'}</small></div><div className="ps-money-cell paid">{amount(row.paidAmount)}</div><div className="ps-money-cell plan">{amount(row.amount)}</div><div className="ps-money-cell debt">{amount(row.debtAmount)}</div><div className="ps-modal-due"><span>{dayjs(row.dueDate).format('DD.MM.YYYY')}</span><small>to‘lov muddati</small></div><span className={`ps-status ${row.paymentStatus}`}>{statusLabels[row.paymentStatus]}</span>
                  </button>)}
                </div>
              </>}
            </Modal>
          </>}
    </div>
  )
}
