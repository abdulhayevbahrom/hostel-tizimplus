const DAY_MS = 86400000

export function vacancyLossProgress(live, now) {
  const todayElapsed = Math.min(DAY_MS, Math.max(0, now - new Date(live.todayStart).getTime()))
  const monthStart = new Date(live.monthStart).getTime()
  const monthEnd = new Date(live.monthEnd).getTime()
  const todayLoss = live.todayFullLoss * todayElapsed / DAY_MS
  return {
    todayElapsed,
    todayLoss,
    monthElapsed: Math.max(0, Math.min(now, monthEnd) - monthStart),
    monthLoss: live.completedDaysLoss + (live.includesToday ? todayLoss : 0),
  }
}
