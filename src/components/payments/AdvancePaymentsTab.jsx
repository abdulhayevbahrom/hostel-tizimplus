import { useState } from 'react'
import { Input, Modal, Popconfirm } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { apiErrorMessage, useGetAdvancePaymentsQuery } from '../../store/baseApi'
import { paymentMethodsText } from '../../utils/paymentParts'

const money = (value) => `${Number(value || 0).toLocaleString('uz-UZ')} so‘m`

export function AdvancePaymentsTab({ canEdit = false, onEdit, onCancelPayment, cancelling = false }) {
  const { data, isLoading, error } = useGetAdvancePaymentsQuery()
  const [selectedPeriodKey, setSelectedPeriodKey] = useState(null)
  const [search, setSearch] = useState('')
  const summary = data?.summary || {}
  const periods = data?.periods || []
  const selectedPeriod = periods.find((period) => period.periodKey === selectedPeriodKey)
  const payments = selectedPeriod?.payments || []
  const searchTerms = search.trim().toLocaleLowerCase('uz-UZ').split(/\s+/).filter(Boolean)
  const filteredPayments = payments.filter((payment) => {
    const text = [payment.student?.fullName, payment.student?.phone, payment.contract?.contractNumber].filter(Boolean).join(' ').toLocaleLowerCase('uz-UZ')
    return searchTerms.every((term) => text.includes(term))
  })

  return <>
    <section className="advance-payment-stats">
      <article><small>Oldindan to‘langan</small><strong>{money(summary.totalAmount)}</strong></article>
      <article><small>Talabalar</small><strong>{summary.studentCount || 0} ta</strong></article>
      <article><small>To‘lovlar</small><strong>{summary.paymentCount || 0} ta</strong></article>
      <article><small>Oylar</small><strong>{summary.periodCount || 0} ta</strong></article>
    </section>
    <section className="payment-card">
      <div className="payment-card-head"><div><h3>Oldindan qilingan to‘lovlar</h3><p>Kelajak oylari uchun avvalroq qabul qilingan to‘lovlar</p></div></div>
      {error && <div className="form-error">{apiErrorMessage(error)}</div>}
      {isLoading ? <div className="payment-loader"><span /> Ma’lumotlar yuklanmoqda...</div> : <div className="payment-table-wrap">
        <table className="payment-table advance-payment-table"><thead><tr><th>To‘lov oyi</th><th>Jami summa</th><th>Talabalar</th><th>Tranzaksiyalar</th><th>Amal</th></tr></thead><tbody>
          {periods.map((period) => <tr key={period.periodKey}><td data-label="To‘lov oyi"><span className="payment-period">{period.periodKey}</span></td><td data-label="Jami summa"><b className="payment-amount">{money(period.totalAmount)}</b></td><td data-label="Talabalar">{period.studentCount} ta</td><td data-label="Tranzaksiyalar">{period.paymentCount} ta</td><td data-label="Amal"><button className="advance-view-button" onClick={() => { setSearch(''); setSelectedPeriodKey(period.periodKey) }}>Ko‘rish</button></td></tr>)}
          {!periods.length && <tr><td className="payment-empty" colSpan="5"><strong>Oldindan to‘lov mavjud emas</strong><p>Kelajak oylari uchun qilingan to‘lovlar shu yerda chiqadi.</p></td></tr>}
        </tbody></table>
      </div>}
    </section>
    <Modal open={Boolean(selectedPeriod)} onCancel={() => setSelectedPeriodKey(null)} footer={null} width={1100} title={selectedPeriod ? `${selectedPeriod.periodKey} uchun oldindan to‘lovlar` : 'Oldindan to‘lovlar'} rootClassName="advance-payment-modal" destroyOnHidden>
      <div className="advance-modal-summary"><span>Jami</span><strong>{money(selectedPeriod?.totalAmount)}</strong><small>{selectedPeriod?.studentCount || 0} ta talaba</small></div>
      <div className="advance-modal-search">
        <Input allowClear prefix={<SearchOutlined />} value={search} onChange={(event) => setSearch(event.target.value)}
          placeholder="Talaba, telefon yoki shartnoma raqami bo‘yicha qidirish" aria-label="Oldindan to‘lovlarni qidirish" />
        <span role="status">{filteredPayments.length} / {payments.length} ta to‘lov</span>
      </div>
      <div className="payment-table-wrap"><table className="payment-table advance-detail-table"><thead><tr><th>Talaba</th><th>Shartnoma</th><th>To‘lov sanasi</th><th>Usuli</th><th>Summa</th>{canEdit && <th>Amal</th>}</tr></thead><tbody>
        {filteredPayments.map((payment) => <tr key={payment.id}><td data-label="Talaba"><strong>{payment.student?.fullName || '—'}</strong><small>{payment.student?.phone || '—'}</small></td><td data-label="Shartnoma">{payment.contract?.contractNumber || '—'}</td><td data-label="To‘lov sanasi">{dayjs(payment.paymentDate || payment.createdAt).format('DD.MM.YYYY')}</td><td data-label="Usuli">{paymentMethodsText(payment)}</td><td data-label="Summa"><b className="payment-amount">{money(payment.amount)}</b></td>{canEdit && <td data-label="Amal">
          {payment.status !== 'cancelled' && <div className="payment-row-actions">
            <button type="button" className="payment-edit" title="Tahrirlash" aria-label="Oldindan to‘lovni tahrirlash"
              disabled={cancelling} onClick={() => { setSelectedPeriodKey(null); onEdit(payment) }}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20h4l11-11-4-4L4 16v4Z" />
                <path d="m13.5 6.5 4 4M4 20h16" />
              </svg>
            </button>
            <Popconfirm title="To‘lovni bekor qilish" description="Summa qarzdorlikka qaytariladi. Davom etasizmi?"
              okText="Bekor qilish" cancelText="Yo‘q" okButtonProps={{ danger: true, loading: cancelling }}
              onConfirm={() => onCancelPayment(payment.id)}>
              <button type="button" className="payment-delete" title="Bekor qilish" aria-label="Oldindan to‘lovni bekor qilish" disabled={cancelling}>×</button>
            </Popconfirm>
          </div>}
        </td>}</tr>)}
        {!filteredPayments.length && <tr><td className="payment-empty" colSpan={canEdit ? 6 : 5}>Qidiruv bo‘yicha to‘lov topilmadi</td></tr>}
      </tbody></table></div>
    </Modal>
  </>
}
