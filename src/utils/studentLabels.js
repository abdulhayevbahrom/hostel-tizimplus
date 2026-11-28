export const studentStatusLabel = { green: 'Qoladi', warning: '50/50', red: 'Ketadi' }

export const paymentStatusLabel = { onTime: 'Ha', almostOnTime: 'Yo‘q', late: 'Yo‘q', pending: 'Kutilmoqda' }

const paymentTimingDetailLabel = { onTime: 'Vaqtida', almostOnTime: 'Deyarli vaqtida', late: 'Kechikkan', pending: 'Kutilmoqda' }

export function getPaymentTimingDetail(status, days) {
  if (Number.isInteger(days)) {
    if (status === 'pending') return `${days} kun qoldi`
    if (status === 'late') return `${days} kun kechikkan`
  }
  return `Muddat holati: ${paymentTimingDetailLabel[status]}`
}

export const educationTypeLabel = { daytime: 'Kunduzgi', evening: 'Kechki', extramural: 'Sirtqi', employed: 'Ishlaydi' }
