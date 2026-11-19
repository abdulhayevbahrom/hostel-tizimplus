import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export function paymentDateFields(value) {
  const date = dayjs(value).utcOffset(300)
  return { paymentDate: date, paymentTime: date }
}

export function formatPaymentDate(date, time) {
  return `${date.format('YYYY-MM-DD')}T${time.format('HH:mm')}`
}
