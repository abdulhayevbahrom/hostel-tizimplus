import dayjs from 'dayjs'

export function RoomVacancyCalendar({ room, summary, period, selectedDate }) {
  const history = new Map((summary.daily || []).map((day) => [day.date,
    day.rooms?.find((item) => String(item.id) === String(room.id))]))
  const capacity = Math.max(0, ...[...history.values()].map((day) => day?.capacityBedDays || 0))
  const dates = selectedDate ? [selectedDate] : Array.from({ length: dayjs(`${period}-01`).daysInMonth() },
    (_, index) => `${period}-${String(index + 1).padStart(2, '0')}`)
  if (!capacity) return <p className="vacancy-bed-note">O‘rinlar bo‘yicha ma’lumot yo‘q.</p>
  return <div className="vacancy-bed-calendar">
    <div className="vacancy-bed-legend"><span><i className="vacancy-bed-vacant" />Bo‘sh</span><span><i className="vacancy-bed-occupied" />Band</span><span>— hisoblanmagan</span></div>
    <div className="vacancy-bed-scroll" role="region" aria-label={`${room.roomNumber}-xona o‘rinlarining kunlik bandligi`} tabIndex={0}>
      <table className="vacancy-bed-table">
        <caption className="vacancy-bed-caption">{period} · o‘rinlar bo‘yicha kalendar</caption>
        <thead><tr><th scope="col">O‘rin / kun</th>{dates.map((date) => <th key={date} scope="col">{Number(date.slice(-2))}</th>)}<th scope="col">Bo‘sh kun</th></tr></thead>
        <tbody>{Array.from({ length: capacity }, (_, index) => {
          const emptyDays = dates.filter((date) => history.get(date)?.bedStates?.[index] === 'vacant').length
          return <tr key={index}><th scope="row">{index + 1}-o‘rin</th>{dates.map((date) => {
            const state = history.get(date)?.bedStates?.[index]
            const label = state === 'vacant' ? 'Bo‘sh' : state === 'occupied' ? 'Band' : 'Hisoblanmagan'
            return <td key={date} className={`vacancy-bed-${state || 'unknown'}`} aria-label={`${index + 1}-o‘rin, ${date}: ${label}`}>
              {state === 'vacant' || state === 'occupied' ? null : '—'}
            </td>
          })}<td className="vacancy-bed-total">{emptyDays} kun</td></tr>
        })}</tbody>
      </table>
    </div>
  </div>
}
