import { effectivePaymentParts, paymentMethods } from './paymentParts.js'

const money = (value) => value == null ? '—' : `${Number(value).toLocaleString('uz-UZ')} so‘m`
const id = (value) => String(value?.id ?? value?._id ?? value ?? '')
const holders = { cashier: 'Kassir hisobida', organization: 'Tashkilot hisobida', mixed: 'Aralash' }
const parts = (payment) => effectivePaymentParts(payment).map((part) => ({
  method: part.method, amount: Number(part.amount), fundHolder: part.fundHolder || payment?.fundHolder || 'organization',
})).sort((a, b) => `${a.method}:${a.fundHolder}`.localeCompare(`${b.method}:${b.fundHolder}`))
const partsText = (rows) => rows.map((part) => `${paymentMethods[part.method] || part.method}: ${money(part.amount)} (${holders[part.fundHolder] || part.fundHolder})`).join('; ') || '—'
const dateText = (value) => !value || Number.isNaN(new Date(value).getTime()) ? '—'
  : new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value))
const allocations = (payment) => (payment?.allocations || []).map((row) => id(row.installment)).sort().join(',')
const periodText = (payment) => payment?.paymentPeriod || (payment?.allocations || []).map((row) => row.installment?.periodKey).filter(Boolean).join(', ') || 'Davr nomi saqlanmagan'

// Compare business fields only: populated references and audit metadata are not edits.
export function paymentAuditChanges(before = {}, after = {}) {
  before ||= {}
  after ||= {}
  const changes = []
  const add = (key, label, oldValue, newValue, format = (value) => value || '—') => {
    if (oldValue !== newValue) changes.push({ key, label, before: format(oldValue), after: format(newValue) })
  }
  add('amount', 'Summa', before.amount == null ? null : Number(before.amount), after.amount == null ? null : Number(after.amount), money)
  const oldParts = parts(before), newParts = parts(after)
  if (JSON.stringify(oldParts) !== JSON.stringify(newParts)) changes.push({ key: 'paymentParts', label: 'To‘lov usuli va hisob', before: partsText(oldParts), after: partsText(newParts) })
  const oldDate = before.paymentDate || before.createdAt
  const newDate = after.paymentDate || after.createdAt
  add('paymentDate', 'To‘lov sanasi', oldDate ? new Date(oldDate).getTime() : null, newDate ? new Date(newDate).getTime() : null, dateText)
  add('note', 'Izoh', before.note || '', after.note || '')
  const hasPeriods = before.paymentPeriod != null && after.paymentPeriod != null
  if (hasPeriods ? before.paymentPeriod !== after.paymentPeriod : allocations(before) !== allocations(after)) {
    changes.push({ key: 'paymentPeriod', label: 'To‘lov oyi', before: periodText(before), after: periodText(after) })
  }
  add('status', 'Holati', before.status || 'active', after.status || 'active', (value) => ({ active: 'Faol', cancelled: 'Bekor qilingan' })[value] || value)
  return changes
}
