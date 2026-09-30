import { useMemo, useState } from 'react'
import { DatePicker, Pagination, Select } from 'antd'
import { useGetAuditLogsQuery, useGetEmployeesQuery } from '../../store/baseApi'
import { AuditLogList } from './AuditLogList'
import { actionLabels, entityLabels } from './auditLabels'
import './AuditLogs.css'

const { RangePicker } = DatePicker

export function AuditLogsPage() {
  const [filters, setFilters] = useState({ page: 1 })
  const { data, isLoading, isFetching } = useGetAuditLogsQuery(filters)
  const { data: employeesData } = useGetEmployeesQuery('')
  const employeeOptions = useMemo(() => (employeesData?.employees || []).map((item) => ({ value: item.id, label: `${item.firstname} ${item.lastname}` })), [employeesData])
  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value || undefined, page: 1 }))

  return <div className="audit-page">
    <section className="audit-card">
      <div className="audit-heading"><div><h2>Amallar tarixi</h2><p>Barcha xodimlarning tizimdagi o‘zgarishlari va kirishlari</p></div><span>{data?.pagination?.total || 0} ta amal</span></div>
      <div className="audit-filters">
        <Select allowClear showSearch optionFilterProp="label" placeholder="Xodim" options={employeeOptions} onChange={(value) => setFilter('employee', value)} />
        <Select allowClear placeholder="Bo‘lim" options={Object.entries(entityLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => setFilter('entityType', value)} />
        <Select allowClear placeholder="Amal turi" options={Object.entries(actionLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => setFilter('action', value)} />
        <RangePicker format="DD.MM.YYYY" placeholder={['Boshlanish', 'Tugash']} onChange={(dates) => setFilters((current) => ({ ...current, from: dates?.[0]?.format('YYYY-MM-DD'), to: dates?.[1]?.format('YYYY-MM-DD'), page: 1 }))} />
      </div>
      <AuditLogList logs={data?.logs} loading={isLoading || isFetching} />
      {(data?.pagination?.totalPages || 0) > 1 && <Pagination current={data.pagination.page} pageSize={data.pagination.limit} total={data.pagination.total} showSizeChanger={false} onChange={(page) => setFilters((current) => ({ ...current, page }))} />}
    </section>
  </div>
}
