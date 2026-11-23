import { useState } from 'react'
import { Empty, Segmented, Select } from 'antd'
import dayjs from 'dayjs'
import './VacancyLossPanel.css'

const money = (value) => `${Number(value || 0).toLocaleString('uz-UZ')} so‘m`
const number = (value) => Number(value || 0).toLocaleString('uz-UZ')
const floorName = (row) => [
  String(row.block ?? '').trim() && `${row.block} blok`,
  row.floor == null || row.floor === '' ? 'Qavat belgilanmagan' : `${row.floor}-qavat`,
].filter(Boolean).join(' · ')
const roomName = (row) => `${row.roomNumber}-xona`
const byLoss = (rows = []) => rows.filter((row) => row.loss > 0).sort((a, b) => b.loss - a.loss)

export function VacancyLossPanel({ summary, period }) {
  const [view, setView] = useState('rooms')
  const [timeframe, setTimeframe] = useState('month')
  const [selectedDate, setSelectedDate] = useState(null)
  if (!summary) return null
  const isDaily = timeframe === 'day'
  const daily = summary.daily || []
  const selectedDay = daily.find((row) => row.date === selectedDate) || daily.at(-1)
  const displayed = isDaily ? selectedDay : summary
  const rooms = byLoss(displayed?.rooms)
  const floors = byLoss(displayed?.floors)
  const cards = view === 'rooms' ? rooms : floors
  const topFloor = floors[0]
  const topRoom = rooms[0]
  const dateLabel = isDaily && selectedDay ? dayjs(selectedDay.date).format('DD.MM.YYYY') : period
  return (
    <section className="light-panel dynamics-panel vacancy-loss-panel">
      <header>
        <h2>Yo‘qotilgan daromad</h2>
        <div className="vacancy-loss-mode"><span>{dateLabel}</span></div>
      </header>
      <div className="vacancy-loss-summary">
        {[
          { label: isDaily ? 'Tanlangan kun bo‘yicha jami' : 'Tanlangan oy bo‘yicha jami', value: money(displayed?.loss) },
          { label: isDaily ? 'Bo‘sh o‘rinlar' : 'Bo‘sh o‘rin-kunlar', value: number(displayed?.vacantBedDays) },
          { label: 'Bir bo‘sh o‘rin uchun kunlik narx', value: money(summary.dailyRate) },
          { label: `${period.slice(0, 4)}-yil bo‘yicha jami`, value: money(summary.yearLoss) },
        ].map(({ label, value }) => (
          <div key={label}><span>{label}</span><strong>{value}</strong></div>
        ))}
      </div>
      <div className="vacancy-loss-controls">
        <Segmented aria-label="Yo‘qotilgan daromad hisoblash davri" value={timeframe} onChange={setTimeframe}
          options={[{ label: 'Oylik', value: 'month' }, { label: 'Kunlik', value: 'day' }]} />
        {isDaily && <Select aria-label="Yo‘qotilgan daromad sanasi" placeholder="Sana tanlang"
          value={selectedDay?.date} onChange={setSelectedDate} style={{ minWidth: 160 }}
          options={daily.map((row) => ({ value: row.date, label: dayjs(row.date).format('DD.MM.YYYY') }))} />}
        <Segmented aria-label="Bo‘sh o‘rinlar hisobining kesimi" value={view} onChange={setView} options={[
          { label: 'Xonalar', value: 'rooms' }, { label: 'Qavatlar', value: 'floors' },
        ]} />
      </div>
      {topFloor && topRoom && (
        <div className="vacancy-priority">
          <span>Birinchi navbatda e’tibor bering</span>
          <strong>{floorName(topFloor)}</strong>
          <p>Tanlangan davrda eng katta yo‘qotish: {money(topFloor.loss)}. Talaba jalb qilishda shu qavatga ustuvorlik bering.</p>
          <p>Eng katta yo‘qotishli xona: {roomName(topRoom)} ({floorName(topRoom)}) — {money(topRoom.loss)}.</p>
        </div>
      )}
      <p className="vacancy-loss-help">
        Faqat yo‘qotilgan daromadi bor {view === 'rooms' ? 'xonalar' : 'qavatlar'} ko‘rsatiladi, eng katta yo‘qotish birinchi turadi.
        {' '}Oylik hisob — davr davomida bo‘sh turgan o‘rinlar; tanlangan kundagi bo‘sh o‘rinlarni ko‘rish uchun «Kunlik»ni tanlang.
      </p>
      <div className="vacancy-cards">
        {cards.map((row, index) => {
          const vacancyRate = row.capacityBedDays ? Math.round(row.vacantBedDays / row.capacityBedDays * 100) : 0
          const lossShare = displayed?.loss ? Math.round(row.loss / displayed.loss * 100) : 0
          const affectedRooms = view === 'floors' ? rooms.filter((room) =>
            String(room.block ?? '') === String(row.block ?? '') && String(room.floor ?? '') === String(row.floor ?? '')) : []
          return (
            <article className={`vacancy-card ${index === 0 ? 'vacancy-card-priority' : ''}`} key={row.id}>
              <div className="vacancy-card-heading">
                <div><h3>{view === 'rooms' ? roomName(row) : floorName(row)}</h3>
                  {view === 'rooms' && <span>{floorName(row)}</span>}</div>
                <span className="vacancy-card-rank">#{index + 1}</span>
              </div>
              <span className="vacancy-card-label">Yo‘qotilgan daromad</span>
              <strong className="vacancy-card-amount">{money(row.loss)}</strong>
              <dl>
                <div><dt>{isDaily ? 'Bo‘sh o‘rinlar' : 'Bo‘sh o‘rin-kun'}</dt><dd>{number(row.vacantBedDays)}</dd></div>
                <div><dt>Bo‘sh turish ulushi</dt><dd>{vacancyRate}%</dd></div>
                <div><dt>Jami yo‘qotishdagi ulushi</dt><dd>{lossShare}%</dd></div>
                {view === 'floors' && <div><dt>Yo‘qotishi bor xonalar</dt><dd>{affectedRooms.length} ta</dd></div>}
              </dl>
              <div className="vacancy-card-meter" role="meter" aria-label="Bo‘sh turish ulushi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={vacancyRate}>
                <span style={{ width: `${vacancyRate}%` }} />
              </div>
              {view === 'floors' && <p className="vacancy-card-rooms">Xonalar: {affectedRooms.map((room) => room.roomNumber).join(', ')}</p>}
            </article>
          )
        })}
      </div>
      {!cards.length && <Empty className="vacancy-cards-empty" description={summary.dailyRate === 0
        ? 'Yo‘qotishni hisoblash uchun sozlamalarda kunlik narxni kiriting'
        : !displayed || (!isDaily && !summary.days) ? 'Tanlangan davr bo‘yicha ma’lumot yo‘q' : 'Tanlangan davrda yo‘qotilgan daromad yo‘q'} />}
      <p className="vacancy-loss-help">
        Bir o‘rin bir kun bo‘sh tursa — 1 o‘rin-kun. {money(summary.dailyRate)} × {displayed?.vacantBedDays || 0} = {money(displayed?.loss)}.
        {' '}Joriy oy bugungacha hisoblanadi; kelgusi kunlar kiritilmaydi. Kunlik summa to‘liq kun uchun hisoblanadi.
        {' '}Hisob mavjud shartnomalar, xonalarning hozirgi sig‘imi va holati asosida tuziladi. Ta’mirdagi xonalar hisobga olinmaydi.
        {' '}Barcha davrlar sozlamadagi joriy kunlik narxda hisoblanadi.
      </p>
    </section>
  )
}
