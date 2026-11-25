const studentId = (student) => String(student?.id ?? student?._id ?? student ?? '')
const studentName = (student) => student?.fullName || 'Talaba nomi qayd etilmagan'
const date = (value) => value && !Number.isNaN(new Date(value).getTime())
  ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)).replaceAll('/', '.')
  : 'Oldingi muddat qayd etilmagan'

export function deadlineAuditChanges(before = {}, after = {}) {
  before ||= {}
  after ||= {}
  const changes = []
  if (studentId(before.student) !== studentId(after.student)) changes.push({ key: 'student', label: 'Talaba',
    before: before.student ? studentName(before.student) : '—', after: after.student ? studentName(after.student) : '—' })
  if (before.periodKey !== after.periodKey) changes.push({ key: 'periodKey', label: 'Qarzdorlik oyi', before: before.periodKey || '—', after: after.periodKey || '—' })
  if (date(before.deadline) !== date(after.deadline)) changes.push({ key: 'deadline', label: 'To‘lov muddati', before: date(before.deadline), after: date(after.deadline) })
  return changes
}
