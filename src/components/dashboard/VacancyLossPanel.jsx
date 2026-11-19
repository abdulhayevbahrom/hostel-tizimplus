import { useState } from 'react'
import { Segmented, Table } from 'antd'
import { DailyLineChart } from './DailyLineChart'

const money = (value) => `${Number(value || 0).toLocaleString('uz-UZ')} so‘m`
const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
const location = (row) => [row.block, `${row.floor}-qavat`].filter(Boolean).join(' · ')

export function VacancyLossPanel({ summary, period }) {
  const [view, setView] = useState('months')
  const [mode, setMode] = useState('chart')
  const [metric, setMetric] = useState('loss')
  if (!summary) return null
  const isMoney = metric === 'loss'
  const metricLabel = isMoney ? 'Yo‘qotilgan daromad' : 'Bo‘sh o‘rin-kun'
  const chartRows = summary[view].map((row, index) => ({
    ...row,
    day: index + 1,
    label: view === 'months' ? monthNames[Number(row.period.slice(5)) - 1] : view === 'rooms' ? row.roomNumber : [row.block, row.floor].filter(Boolean).join(' / '),
    detailLabel: view === 'months' ? row.period : view === 'rooms' ? `${location(row)} · ${row.roomNumber}-xona` : location(row),
  }))
  const columns = [
    ...(view === 'months'
      ? [{ title: 'Oy', dataIndex: 'period' }]
      : [{ title: 'Qavat', key: 'floor', render: (_, row) => location(row) },
        ...(view === 'rooms' ? [{ title: 'Xona', dataIndex: 'roomNumber' }] : [])]),
    { title: 'Bo‘sh o‘rin-kun', dataIndex: 'vacantBedDays', align: 'right', render: (value) => value.toLocaleString('uz-UZ') },
    { title: 'Yo‘qotilgan daromad', dataIndex: 'loss', align: 'right', render: money },
  ]
  return (
    <section className="light-panel dynamics-panel vacancy-loss-panel">
      <header>
        <h2>Yo‘qotilgan daromad</h2>
        <div className="vacancy-loss-mode">
          <span>{period}</span>
          <Segmented aria-label="Yo‘qotilgan daromad ko‘rinishi" value={mode} onChange={setMode} options={[
            { label: 'Grafik', value: 'chart' }, { label: 'Jadval', value: 'number' },
          ]} />
        </div>
      </header>
      <div className="vacancy-loss-summary">
        <div><span>Tanlangan oy bo‘yicha jami</span><strong>{money(summary.loss)}</strong></div>
        <div><span>Bo‘sh o‘rin-kunlar</span><strong>{summary.vacantBedDays.toLocaleString('uz-UZ')}</strong></div>
        <div><span>Kunlik narx</span><strong>{money(summary.dailyRate)}</strong></div>
        <div><span>{period.slice(0, 4)}-yil bo‘yicha jami</span><strong>{money(summary.yearLoss)}</strong></div>
      </div>
      <p className="vacancy-loss-help">
        Bir o‘rin bir kun bo‘sh tursa — 1 o‘rin-kun. {money(summary.dailyRate)} × {summary.vacantBedDays} = {money(summary.loss)}.
        {' '}Joriy oy bugungacha hisoblanadi; kelgusi kunlar kiritilmaydi.
        {' '}Hisob mavjud shartnomalar, xonalarning hozirgi sig‘imi va holati asosida tuziladi. Ta’mirdagi xonalar hisobga olinmaydi.
        {' '}Barcha oylar sozlamadagi joriy kunlik narxda hisoblanadi.
      </p>
      {summary.dailyRate === 0 && <p className="vacancy-loss-help">Hisob summasini ko‘rish uchun admin umumiy sozlamalarda bo‘sh o‘rin uchun kunlik narxni kiritsin.</p>}
      <div className="vacancy-loss-controls">
        <Segmented aria-label="Bo‘sh o‘rinlar hisobining kesimi" value={view} onChange={setView} options={[
          { label: 'Xonalar', value: 'rooms' }, { label: 'Qavatlar', value: 'floors' }, { label: 'Oylar', value: 'months' },
        ]} />
        {mode === 'chart' && <Segmented aria-label="Grafik ko‘rsatkichi" value={metric} onChange={setMetric} options={[
          { label: 'Yo‘qotilgan daromad', value: 'loss' }, { label: 'Bo‘sh o‘rin-kun', value: 'vacantBedDays' },
        ]} />}
      </div>
      {mode === 'chart' ? <>
        <div className="vacancy-loss-chart-label"><span className="chart-keys"><i className="income" />{metricLabel}</span></div>
        <div className="vacancy-loss-chart-scroll">
          <div style={{ minWidth: Math.max(600, chartRows.length * 65) }}>
            <DailyLineChart key={`${view}-${metric}-${period}`} rows={chartRows} width={Math.max(1100, chartRows.length * 65)}
              series={[{ key: metric, label: metricLabel, tone: 'income', format: isMoney ? money : (value) => `${value.toLocaleString('uz-UZ')} o‘rin-kun` }]}
              label={`${metricLabel}: ${view === 'months' ? 'oylar' : view === 'rooms' ? 'xonalar' : 'qavatlar'} bo‘yicha`} />
          </div>
        </div>
      </> : <Table size="small" rowKey={view === 'months' ? 'period' : 'id'} columns={columns}
        dataSource={summary[view]} pagination={view === 'months' ? false : { pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 520 }} locale={{ emptyText: 'Tanlangan davr bo‘yicha ma’lumot yo‘q' }} />}
    </section>
  )
}
