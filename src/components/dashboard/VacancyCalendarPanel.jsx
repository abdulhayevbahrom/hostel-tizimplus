import { useState } from 'react'
import { Empty, Select, Table } from 'antd'
import dayjs from 'dayjs'
import { vacancyCalendar } from '../../utils/vacancyCalendar'
import './VacancyCalendarPanel.css'

const location = (room) => [room.block && `${room.block} blok`, room.floor && `${room.floor}-qavat`].filter(Boolean).join(' · ')
const number = (value) => Number(value || 0).toLocaleString('uz-UZ')

export function VacancyCalendarPanel({ summary, period }) {
  const [selectedId, setSelectedId] = useState(null)
  if (!summary) return null
  const rooms = vacancyCalendar(summary)
  const selected = rooms.find((room) => String(room.id) === selectedId) || rooms[0]
  const calendarDays = dayjs(`${period}-01`).daysInMonth()
  const dayCount = summary.days || 0
  const columns = [
    { title: 'Xona', key: 'room', render: (_, room) => <button type="button" className="vacancy-room-link"
      onClick={() => setSelectedId(String(room.id))} aria-label={`${room.roomNumber}-xona kunlik hisobini ko‘rish`}
      aria-pressed={String(selected?.id) === String(room.id)}>
      <strong>{room.roomNumber}-xona</strong><span>{location(room)}</span>
    </button> },
    { title: 'Bo‘sh o‘rin-kun', dataIndex: 'vacantBedDays', key: 'vacantBedDays', align: 'right', render: number },
    { title: 'Bo‘sh o‘rin bo‘lgan kunlar', dataIndex: 'vacancyDays', key: 'vacancyDays', align: 'right', render: (value) => `${value} kun` },
    { title: 'Bir kundagi eng ko‘p bo‘sh o‘rin', dataIndex: 'maxVacant', key: 'maxVacant', align: 'right', render: (value) => `${value} ta` },
    { title: 'Bandlik', dataIndex: 'occupancyRate', key: 'occupancyRate', align: 'right', render: (value) => `${value.toFixed(1)}%` },
  ]
  return <section className="light-panel vacancy-calendar-panel">
    <header><h2>Bo‘sh o‘rinlar hisobi</h2><span>{period} · {dayCount} kun hisoblangan</span></header>
    <div className="vacancy-calendar-content">
      <p className="vacancy-calendar-help">Xonalar jami bo‘sh o‘rin-kun bo‘yicha saralangan. Bir o‘rin bir kun bo‘sh tursa — 1 o‘rin-kun. Keyin band bo‘lishi oldingi hisobni o‘zgartirmaydi.</p>
      {!rooms.length ? <Empty description="Tanlangan oy bo‘yicha hisoblangan xonalar yo‘q" /> : <>
        <Table className="vacancy-ranking" size="small" rowKey="id" columns={columns} dataSource={rooms}
          rowClassName={(room) => String(room.id) === String(selected.id) ? 'vacancy-selected-row' : ''}
          scroll={{ x: 650 }} pagination={rooms.length > 10 ? { pageSize: 10, showSizeChanger: false } : false} />
        <div className="vacancy-calendar-toolbar">
          <label htmlFor="vacancy-calendar-room">Xonaning kunlik hisobi</label>
          <Select id="vacancy-calendar-room" value={String(selected.id)} onChange={setSelectedId} showSearch
            optionFilterProp="label" options={rooms.map((room) => ({ value: String(room.id),
              label: `${room.roomNumber}-xona${location(room) ? ` · ${location(room)}` : ''}` }))} />
        </div>
        <div className="vacancy-calendar-stats" aria-live="polite">
          <div><span>Jami bo‘sh o‘rin-kun</span><strong>{number(selected.vacantBedDays)}</strong></div>
          <div><span>Kamida bitta o‘rin bo‘sh bo‘lgan</span><strong>{selected.vacancyDays} kun</strong></div>
          <div><span>{selected.lastDay ? `${dayjs(selected.lastDay.date).format('DD.MM')} holatiga bo‘sh o‘rin` : 'Oxirgi kundagi bo‘sh o‘rin'}</span>
            <strong>{selected.lastDay?.available ? `${selected.lastDay.vacant} ta` : '—'}</strong></div>
        </div>
        <div className="vacancy-calendar-legend"><span><i className="vacancy-day-empty" />Bo‘sh o‘rin bor</span><span><i className="vacancy-day-full" />To‘liq band</span><span>— Hisoblanmagan</span></div>
        <div className="vacancy-calendar-scroll" role="region" aria-label={`${selected.roomNumber}-xonaning ${period} oyidagi kunlik bandligi`} tabIndex={0}>
          <table className="vacancy-calendar-table">
            <caption>{selected.roomNumber}-xona · {location(selected)}</caption>
            <thead><tr><th scope="col">Oy kuni</th>{Array.from({ length: calendarDays }, (_, index) => <th key={index} scope="col">{index + 1}</th>)}</tr></thead>
            <tbody>{[{ key: 'vacant', label: 'Bo‘sh o‘rin' }, { key: 'occupied', label: 'Band o‘rin' }].map(({ key, label }) =>
              <tr key={key}><th scope="row">{label}</th>{Array.from({ length: calendarDays }, (_, index) => {
                const day = selected.days[index]
                const available = Boolean(day?.available)
                return <td key={index} className={!available ? 'vacancy-day-unknown' : day.vacant > 0 ? 'vacancy-day-empty' : 'vacancy-day-full'}
                  aria-label={`${index + 1}-kun: ${available ? `${day[key]} ta ${label.toLowerCase()}` : index >= dayCount ? 'Hali hisoblanmagan' : 'Xona hisobga olinmagan'}`}>
                  {available ? day[key] : '—'}
                </td>
              })}</tr>)}</tbody>
          </table>
        </div>
        <p className="vacancy-calendar-help">Kunlik bo‘sh o‘rinlar yig‘indisi: <strong>{number(selected.vacantBedDays)} o‘rin-kun</strong>. Hisoblangan sig‘im: {number(selected.capacityBedDays)} o‘rin-kun. Bandlik: {selected.occupancyRate.toFixed(1)}%.</p>
        <p className="vacancy-calendar-help">Hisob shartnomalar asosida tuziladi. Raqamlangan o‘rinlar shartnomada saqlanadi; eski raqamsiz shartnomalarning o‘rni taxminan belgilanadi. Joriy oy bugungacha hisoblanadi; kelgusi kunlar bo‘sh deb olinmaydi.</p>
      </>}
    </div>
  </section>
}
