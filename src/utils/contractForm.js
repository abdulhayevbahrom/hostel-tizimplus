import dayjs from 'dayjs'

export const createContractInitialValues = () => {
  const startDate = dayjs().startOf('day')
  return { contractNumber: `SHARTNOMA-${startDate.format('YYYY-MM')}`, room: undefined, bedNumber: undefined,
    startDate, endDate: startDate.add(1, 'month'), paymentType: 'monthly', paymentAmount: 0,
    depositEnabled: false, depositAmount: 0, status: 'active', note: '' }
}
