export function calculatePaymentProgress(row, now) {
  const start = new Date(row.startDate).getTime()
  const end = new Date(row.endDate).getTime()
  const duration = Math.max(0, end - start)
  const amount = Math.max(0, Number(row.amount) || 0)
  const paid = Math.min(amount, Math.max(0, Number(row.paidAmount) || 0))
  const elapsed = Math.min(duration, Math.max(0, now - start))
  // Partial payments cover the earliest part of their allocated billing period.
  const coveredDuration = amount > 0 ? duration * paid / amount : 0
  const earned = duration > 0 ? Math.floor(Math.min(paid, amount * elapsed / duration)) : 0
  const remaining = Math.max(0, paid - earned)
  const coveredUntil = start + coveredDuration
  const accruedAmount = duration > 0 ? Math.floor(amount * elapsed / duration) : 0
  const unpaidServiceAmount = Math.max(0, accruedAmount - paid)
  const overdueTime = Math.max(0, elapsed - coveredDuration)
  const status = paid <= 0 ? 'unpaid' : now < start ? 'upcoming' : overdueTime > 0 && paid < amount ? 'overdue' : remaining <= 0 ? 'completed' : 'active'
  return { ...row, paymentStatus: paid <= 0 ? 'unpaid' : paid >= amount ? 'paid' : 'partial', paidAmount: paid, earned, remaining, percent: paid > 0 ? earned / paid * 100 : 0,
    elapsed: Math.min(elapsed, coveredDuration), remainingTime: Math.max(0, coveredUntil - Math.max(now, start)),
    accruedAmount, unpaidServiceAmount, overdueTime, livedTime: elapsed, coveredDuration, coveredUntil, startsIn: Math.max(0, start - now), status }
}

export function splitDuration(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000))
  return { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 }
}

export function summarizePaymentProgress(rows) {
  const students = new Map()
  const priority = { completed: 0, upcoming: 1, active: 2, overdue: 3, unpaid: 4 }
  const summary = { paid: 0, earned: 0, remaining: 0, active: 0, completed: 0, upcoming: 0, unpaid: 0, overdue: 0, studentCount: 0, periodCount: rows.length }
  for (const row of rows) {
    summary.paid += row.paidAmount
    summary.earned += row.earned
    summary.remaining += row.remaining
    const id = row.student?.id || row.student?._id
    if (!id) continue
    const key = String(id)
    const previous = students.get(key)
    // Count each student once, prioritizing a payment that is still accruing.
    if (!previous || priority[row.status] > priority[previous]) students.set(key, row.status)
  }
  for (const status of students.values()) summary[status] += 1
  summary.studentCount = students.size
  return summary
}
