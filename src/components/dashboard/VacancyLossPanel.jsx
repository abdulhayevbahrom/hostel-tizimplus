import { useState } from 'react'
import { Segmented, Select, Table } from 'antd'
import dayjs from 'dayjs'

const money = (value) => `${Number(value || 0).toLocaleString('uz-UZ')} so‘m`

export function VacancyLossPanel({ summary, period }) {
  const [view, setView] = useState('rooms')
  const [timeframe, setTimeframe] = useState('month')
  const [selectedDate, setSelectedDate] = useState(null)
  if (!summary) return null
  const isDaily = timeframe === 'day'
  const daily = summary.daily || []
  const selectedDay = daily.find((row) => row.date === selectedDate) || daily.at(-1)
  const displayed = isDaily ? selectedDay : summary
  const tableRows = view === 'months' ? (isDaily ? daily : summary.months) : displayed?.[view] || []
  const hasFloorBlocks = (displayed?.floors || []).some((row) => String(row.block ?? '').trim())
  const columns = [
    ...(view === 'months'
      ? (isDaily ? [{ title: 'Sana', dataIndex: 'date', render: (value) => dayjs(value).format('DD.MM.YYYY') }] : [{ title: 'Oy', dataIndex: 'period' }, { title: 'Hisoblangan kunlar', dataIndex: 'days', align: 'right' }])
      : [...(view === 'floors' && hasFloorBlocks ? [{ title: 'Blok', dataIndex: 'block', render: (value) => String(value ?? '').trim() }] : []),
        { title: 'Qavat', dataIndex: 'floor', render: (value) => value == null || value === '' ? '—' : `${value}-qavat` },
        ...(view === 'rooms' ? [{ title: 'Xona', dataIndex: 'roomNumber', render: (value, row) => [row.block && `${row.block} blok`, value].filter(Boolean).join(' · ') }, { title: isDaily ? 'Jami o‘rinlar' : 'Jami o‘rin-kun', dataIndex: 'capacityBedDays', align: 'right' }] : [])]),
    { title: isDaily ? 'Bo‘sh o‘rinlar' : 'Bo‘sh o‘rin-kun', dataIndex: 'vacantBedDays', align: 'right', render: (value) => value.toLocaleString('uz-UZ') },
    { title: 'Yo‘qotilgan daromad', dataIndex: 'loss', align: 'right', render: money },
  ]
  return (
    <section className="light-panel dynamics-panel vacancy-loss-panel">
      <header>
        <h2>Yo‘qotilgan daromad</h2>
        <div className="vacancy-loss-mode">
          <span>{period}</span>
        </div>
      </header>
      <div className="vacancy-loss-summary">
        {[
          { label: isDaily ? 'Tanlangan kun bo‘yicha jami' : 'Tanlangan oy bo‘yicha jami', value: money(displayed?.loss) },
          { label: isDaily ? 'Bo‘sh o‘rinlar' : 'Bo‘sh o‘rin-kunlar', value: Number(displayed?.vacantBedDays || 0).toLocaleString('uz-UZ') },
          { label: 'Bir bo‘sh o‘rin uchun kunlik narx', value: money(summary.dailyRate) },
          { label: `${period.slice(0, 4)}-yil bo‘yicha jami`, value: money(summary.yearLoss) },
        ].map(({ label, value }) => (
          <div key={label}><span>{label}</span><strong>{value}</strong></div>
        ))}
      </div>
      <p className="vacancy-loss-help">
        Bir o‘rin bir kun bo‘sh tursa — 1 o‘rin-kun. {money(summary.dailyRate)} × {displayed?.vacantBedDays || 0} = {money(displayed?.loss)}.
        {' '}Joriy oy bugungacha hisoblanadi; kelgusi kunlar kiritilmaydi.
        {' '}Hisob mavjud shartnomalar, xonalarning hozirgi sig‘imi va holati asosida tuziladi. Ta’mirdagi xonalar hisobga olinmaydi.
        {' '}Barcha oylar sozlamadagi joriy kunlik narxda hisoblanadi.
      </p>
      {summary.dailyRate === 0 && <p className="vacancy-loss-help">Hisob summasini ko‘rish uchun admin umumiy sozlamalarda bo‘sh o‘rin uchun kunlik narxni kiritsin.</p>}
      <div className="vacancy-loss-controls">
        <Segmented aria-label="Yo‘qotilgan daromad hisoblash davri" value={timeframe} onChange={setTimeframe}
          options={[{ label: 'Oylik', value: 'month' }, { label: 'Kunlik', value: 'day' }]} />
        {isDaily && view !== 'months' && <Select aria-label="Yo‘qotilgan daromad sanasi" placeholder="Sana tanlang"
          value={selectedDay?.date} onChange={setSelectedDate} style={{ minWidth: 160 }}
          options={daily.map((row) => ({ value: row.date, label: dayjs(row.date).format('DD.MM.YYYY') }))} />}
        <Segmented aria-label="Bo‘sh o‘rinlar hisobining kesimi" value={view} onChange={setView} options={[
          { label: 'Xonalar', value: 'rooms' }, { label: 'Qavatlar', value: 'floors' }, { label: isDaily ? 'Kunlar' : 'Oylar', value: 'months' },
        ]} />
      </div>
      {isDaily && selectedDay && view !== 'months' && <p className="vacancy-loss-help">Hisob sanasi: {dayjs(selectedDay.date).format('DD.MM.YYYY')}. Summa shu kunning to‘liq kunlik hisobidir.</p>}
      <Table size="small" bordered rowKey={view === 'months' ? (isDaily ? 'date' : 'period') : 'id'} columns={columns}
        dataSource={tableRows} pagination={false}
        scroll={{ x: view === 'rooms' ? 820 : 600 }} locale={{ emptyText: 'Tanlangan davr bo‘yicha ma’lumot yo‘q' }} />
    </section>
  )
}
