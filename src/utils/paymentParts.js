export const paymentMethods = { cash: 'Naqd', online: 'Click', bank: 'Bank', card: 'Karta' }

export const effectivePaymentParts = (payment) => payment?.paymentParts?.length
  ? payment.paymentParts
  : payment?.method && payment.method !== 'mixed' ? [{ method: payment.method, amount: Number(payment.amount || 0), fundHolder: payment.fundHolder }] : []

export const paymentBreakdown = (payment) => Object.fromEntries(effectivePaymentParts(payment).map((part) => [part.method, Number(part.amount || 0)]))
export const breakdownTotal = (breakdown) => Object.values(breakdown || {}).reduce((sum, amount) => sum + Number(amount || 0), 0)

export const paymentMethodsText = (payment) => effectivePaymentParts(payment)
  .map((part) => `${paymentMethods[part.method] || part.method}: ${Number(part.amount || 0).toLocaleString('uz-UZ')} so‘m`)
  .join(' + ') || '—'
