import { useId, useState } from 'react'
import { Alert, Button, DatePicker, Segmented, Table } from 'antd'
import { TableOutlined, UpOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { apiErrorMessage, useGetStudentCountRangeQuery } from '../../store/baseApi'

const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

export function StudentCountTable({ period, summary, yearlyCounts, countPeriod, onCountPeriodChange }) {
  const [expanded, setExpanded] = useState(false)
  const [range, setRange] = useState(null)
  const bodyId = useId()
  const isYearly = countPeriod === 'year'
  const isRange = countPeriod === 'range'
  const year = period.slice(0, 4)
  const rangeReady = Boolean(range?.[0] && range?.[1])
  const { currentData: rangeData, isFetching, error, refetch } = useGetStudentCountRangeQuery({
    startDate: range?.[0]?.format('YYYY-MM-DD'), endDate: range?.[1]?.format('YYYY-MM-DD'),
  }, { skip: !isRange || !rangeReady, refetchOnFocus: true, refetchOnReconnect: true })
  const rows = isRange ? rangeData?.rows || [] : isYearly
    ? (yearlyCounts || []).map(({ month, studentCount }) => ({ date: `${monthNames[month - 1]} ${year}`, studentCount }))
    : (summary?.rows || []).map((row) => ({ ...row, date: `${period}-${String(row.day).padStart(2, '0')}` }))
  const tableRows = rows.map((row, index) => ({ ...row,
    label: isYearly ? row.date : dayjs(row.date).format('DD.MM.YYYY'),
    change: index ? row.studentCount - rows[index - 1].studentCount : null,
  }))
  const columns = [
    { title: isYearly ? 'Oy' : 'Sana', dataIndex: 'label' },
    { title: 'Talabalar soni', dataIndex: 'studentCount', align: 'right', render: (value) => `${value.toLocaleString('uz-UZ')} ta` },
    { title: isYearly ? 'Oldingi oyga nisbatan o‘zgarish' : 'Oldingi kunga nisbatan o‘zgarish', dataIndex: 'change', align: 'right',
      render: (value) => value == null ? '—' : `${value > 0 ? '+' : ''}${value} ta` },
  ]
  const latest = tableRows.at(-1)
  return <section className="light-panel dynamics-panel dashboard-data-table student-count-panel">
    <header>
      <h2>Talabalar sonining o‘zgarishi</h2>
      <div className="student-count-header-actions">
        <span className="student-count-latest" role="status">
          {isRange && isFetching ? 'Yuklanmoqda…' : isRange && error ? 'Ma’lumot yuklanmadi' : latest
            ? <><span>{latest.label} holatiga</span><strong>{latest.studentCount.toLocaleString('uz-UZ')} ta talaba</strong></>
            : isRange && !rangeReady ? 'Sana oralig‘ini tanlang' : 'Ma’lumot yo‘q'}
        </span>
        <Button className="student-count-toggle" icon={expanded ? <UpOutlined /> : <TableOutlined />}
          onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls={bodyId}>
          {expanded ? 'Qisqa ko‘rinish' : 'Batafsil statistika'}
        </Button>
      </div>
    </header>
    <div id={bodyId} hidden={!expanded}>
      <div className="student-count-controls">
        <Segmented className="student-chart-period-toggle" aria-label="Talabalar jadvali davri" value={countPeriod}
          options={[{ label: 'Oylik', value: 'month' }, { label: 'Yillik', value: 'year' }, { label: 'Sana oralig‘i', value: 'range' }]}
          onChange={onCountPeriodChange} />
        {isRange ? <DatePicker.RangePicker value={range} onChange={setRange} format="DD.MM.YYYY"
          placeholder={['Boshlanish sanasi', 'Tugash sanasi']} aria-label="Talabalar hisobi sana oralig‘i"
          disabledDate={(date) => date.isAfter(dayjs(), 'day')} /> : <span>{isYearly ? year : period}</span>}
      </div>
      {isRange && error ? <Alert type="error" showIcon title={apiErrorMessage(error)}
        action={<Button onClick={refetch}>Qayta yuklash</Button>} /> : <>
        <Table size="small" bordered rowKey="date" columns={columns} dataSource={tableRows} loading={isRange && isFetching}
          pagination={isRange && tableRows.length > 31 ? { pageSize: 31, showSizeChanger: false } : false} scroll={{ x: 560 }}
          locale={{ emptyText: isRange && !rangeReady ? 'Boshlanish va tugash sanalarini tanlang' : 'Tanlangan davr bo‘yicha ma’lumot yo‘q' }} />
      </>}
    </div>
  </section>
}
