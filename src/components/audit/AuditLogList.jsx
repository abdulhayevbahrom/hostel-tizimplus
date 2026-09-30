import { useState } from 'react'
import { Modal } from 'antd'
import { EyeOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { actionLabels, entityLabels } from './auditLabels'

const dateTime = (value) => {
  if (!value) return '—'
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23', timeZone: 'Asia/Tashkent',
  }).formatToParts(new Date(value)).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`
}

const employeeName = (log) => {
  const employee = log.employee
  if (employee?.firstname || employee?.lastname) return `${employee.firstname || ''} ${employee.lastname || ''}`.trim()
  return log.employeeSnapshot?.fullName || 'Noma’lum xodim'
}

function Location({ log }) {
  const { latitude, longitude, city, country } = log.location || {}
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
  if (!hasCoordinates && !city && !country) return <span className="audit-muted">Ruxsat berilmagan</span>
  const label = [city, country].filter(Boolean).join(', ') || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
  return hasCoordinates
    ? <a className="audit-location" href={`https://www.google.com/maps?q=${latitude},${longitude}`} target="_blank" rel="noreferrer"><EnvironmentOutlined /> {label}</a>
    : <span>{label}</span>
}

const ignoredFields = new Set(['_id', 'id', '__v', 'createdAt', 'updatedAt', 'spentAt', 'createdBy', 'updatedBy', 'deletedAt', 'deletedBy', 'isDeleted', 'studentId', 'expenseId', 'paymentId', 'fineId', 'employeeId', 'roomId', 'universityId', 'facultyId', 'blockId'])
const fieldLabels = {
  title: 'Nomi', category: 'Kategoriya', amount: 'Summa', paymentType: 'To‘lov turi', note: 'Izoh',
  fullName: 'F.I.Sh.', firstname: 'Ism', lastname: 'Familiya', phone: 'Telefon', parentPhone: 'Ota-ona telefoni',
  address: 'Manzil', course: 'Kurs', status: 'Holati', studentStatus: 'Talaba holati', room: 'Xona',
  university: 'Universitet', faculty: 'Fakultet', student: 'Talaba', contract: 'Shartnoma',
  paymentPurpose: 'To‘lov maqsadi', paymentMethod: 'To‘lov usuli', contractAmount: 'Shartnoma summasi',
  depositAmount: 'Depozit summasi', hostelName: 'Yotoqxona nomi', login: 'Login', role: 'Lavozim turi',
  position: 'Lavozim', isActive: 'Faol holati', canLogin: 'Kirish huquqi', date: 'Sana', deadline: 'Muddat',
}

const valueText = (value) => {
  if (value == null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Ha' : 'Yo‘q'
  if (typeof value === 'object') {
    if (value.fullName) return value.fullName
    if (value.firstname || value.lastname) return `${value.firstname || ''} ${value.lastname || ''}`.trim()
    if (value.name) return value.name
    if (Array.isArray(value)) return value.map(valueText).join(', ')
    return Object.entries(value).filter(([key]) => !ignoredFields.has(key)).map(([key, item]) => `${fieldLabels[key] || key}: ${valueText(item)}`).join(', ') || '—'
  }
  return String(value)
}

const objectId = (value) => {
  if (typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)) return value
  if (!value || typeof value !== 'object') return null
  const id = value.id || value._id
  return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id) ? id : null
}

const valuesEqual = (before, after) => {
  const beforeId = objectId(before)
  const afterId = objectId(after)
  if (beforeId && afterId) return beforeId === afterId
  return valueText(before) === valueText(after)
}

const responseKeys = { student: 'student', contract: 'contract', payment: 'payment', expense: 'expense', fine: 'fine', employee: 'employee', room: 'room', university: 'university', faculty: 'faculty', 'building-block': 'block', settings: 'settings', 'cash-session': 'session', 'debtor-deadline': 'deadline', 'salary-payment': 'payment' }
const unwrapAuditValue = (log, value) => {
  if (!value || typeof value !== 'object') return {}
  const nested = value[responseKeys[log.entityType]]
  return nested && typeof nested === 'object' ? nested : value
}
const auditChanges = (log) => {
  const oldData = unwrapAuditValue(log, log.oldValue)
  const newData = unwrapAuditValue(log, log.newValue)
  return [...new Set([...Object.keys(oldData), ...Object.keys(newData)])]
    .filter((key) => !ignoredFields.has(key))
    .filter((key) => !valuesEqual(oldData[key], newData[key]))
    .map((key) => ({ key, before: valueText(oldData[key]), after: valueText(newData[key]) }))
}
const auditSummary = (log) => {
  if (log.action === 'login') return 'Xodim tizimga muvaffaqiyatli kirdi'
  const entity = entityLabels[log.entityType] || log.entityType
  const oldData = unwrapAuditValue(log, log.oldValue)
  if (log.action === 'delete') {
    const identity = oldData.fullName || oldData.title || oldData.name || oldData.reason || oldData.contractNumber || oldData.roomNumber
    return `${entity} o‘chirildi${identity ? `: ${valueText(identity)}` : ''}`
  }
  const changes = auditChanges(log)
  if (!changes.length) return log.description
  const details = changes.slice(0, 2).map(({ key, before, after }) => `${fieldLabels[key] || key}: ${before} → ${after}`).join('; ')
  return `${details}${changes.length > 2 ? `; yana ${changes.length - 2} ta o‘zgarish` : ''}`
}

function Changes({ log }) {
  const oldData = unwrapAuditValue(log, log.oldValue)
  if (log.action === 'delete') {
    const deletedFields = Object.keys(oldData).filter((key) => !ignoredFields.has(key)).map((key) => ({ key, value: valueText(oldData[key]) })).filter(({ value }) => value !== '—')
    if (!deletedFields.length) return <div className="audit-no-changes">O‘chirilgan ma’lumot tafsiloti mavjud emas</div>
    return <section className="audit-deleted"><h4>O‘chirilgan ma’lumot</h4><div>{deletedFields.map(({ key, value }) => <div className="audit-deleted-row" key={key}><span>{fieldLabels[key] || key}</span><strong>{value}</strong></div>)}</div></section>
  }
  const changes = auditChanges(log)
  if (!changes.length) return <div className="audit-no-changes">Ko‘rsatiladigan ma’lumot o‘zgarishi yo‘q</div>
  return <div className="audit-changes">{changes.map(({ key, before, after }) => <div className="audit-change" key={key}>
    <span className="audit-change-label">{fieldLabels[key] || key}</span>
    <div><strong className="audit-before">{before}</strong><span className="audit-arrow">→</span><strong className="audit-after">{after}</strong></div>
  </div>)}</div>
}

export function AuditLogList({ logs = [], loading = false, compact = false }) {
  const [selected, setSelected] = useState(null)
  if (loading) return <div className="audit-state">Amallar tarixi yuklanmoqda…</div>
  if (!logs.length) return <div className="audit-state">Amallar tarixi hali mavjud emas</div>

  return <>
    <div className="audit-table-wrap">
      <table className={`audit-table ${compact ? 'compact' : ''}`}>
        <thead><tr><th>Sana va vaqt</th><th>Xodim</th><th>Amal</th><th>Tafsilot</th><th>Bo‘lim</th>{!compact && <th>IP / lokatsiya</th>}<th /></tr></thead>
        <tbody>{logs.map((log) => <tr key={log.id} className={`audit-row-${log.action}`}>
          <td data-label="Sana">{dateTime(log.createdAt)}</td>
          <td data-label="Xodim"><strong>{employeeName(log)}</strong><small>{log.employeeSnapshot?.position || log.employee?.position || log.employeeSnapshot?.login}</small></td>
          <td data-label="Amal"><span className={`audit-action ${log.action}`}>{actionLabels[log.action] || log.action}</span></td>
          <td data-label="Tafsilot" className="audit-summary">{auditSummary(log)}</td>
          <td data-label="Bo‘lim">{entityLabels[log.entityType] || log.entityType}</td>
          {!compact && <td data-label="IP / lokatsiya"><code>{log.ipAddress || '—'}</code><Location log={log} /></td>}
          <td><button type="button" className="audit-view" onClick={() => setSelected(log)}><EyeOutlined /> Batafsil</button></td>
        </tr>)}</tbody>
      </table>
    </div>
    <Modal className="audit-modal" width={980} open={Boolean(selected)} title="Amal tafsilotlari" footer={null} onCancel={() => setSelected(null)}>
      {selected && <div className="audit-detail">
        <div className="audit-detail-meta">
          <div><span>Xodim</span><strong>{employeeName(selected)}</strong></div>
          <div><span>Vaqt</span><strong>{dateTime(selected.createdAt)}</strong></div>
          <div><span>IP manzil</span><strong>{selected.ipAddress || '—'}</strong></div>
          <div><span>Lokatsiya</span><strong><Location log={selected} /></strong></div>
          <div><span>Qurilma</span><strong>{selected.userAgent || '—'}</strong></div>
        </div>
        <Changes log={selected} />
      </div>}
    </Modal>
  </>
}
