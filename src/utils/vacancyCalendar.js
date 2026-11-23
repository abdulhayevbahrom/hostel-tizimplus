// Daily room counts are authoritative; contracts do not identify physical beds.
export function vacancyCalendar(summary) {
  const daily = summary?.daily || []
  const byRoom = new Map()
  for (const day of daily) {
    for (const room of day.rooms || []) {
      const key = String(room.id)
      if (!byRoom.has(key)) byRoom.set(key, new Map())
      byRoom.get(key).set(day.date, room)
    }
  }
  return (summary?.rooms || []).map((room) => {
    const history = byRoom.get(String(room.id)) || new Map()
    const days = daily.map(({ date }) => {
      const row = history.get(date)
      return { date, available: Boolean(row), vacant: row?.vacantBedDays ?? null,
        occupied: row ? row.capacityBedDays - row.vacantBedDays : null, capacity: row?.capacityBedDays ?? null }
    })
    const availableDays = days.filter((day) => day.available)
    return { ...room, days, vacancyDays: availableDays.filter((day) => day.vacant > 0).length,
      maxVacant: Math.max(0, ...availableDays.map((day) => day.vacant)),
      lastDay: days.at(-1) || null,
      occupancyRate: room.capacityBedDays ? (room.capacityBedDays - room.vacantBedDays) / room.capacityBedDays * 100 : 0 }
  }).sort((a, b) => b.vacantBedDays - a.vacantBedDays || String(a.roomNumber).localeCompare(String(b.roomNumber), 'uz', { numeric: true }) || String(a.id).localeCompare(String(b.id)))
}
