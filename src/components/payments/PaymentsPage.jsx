import { useMemo, useState } from 'react'
import { Button, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Select } from 'antd'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { apiErrorMessage, useCreatePaymentMutation, useDeletePaymentMutation, useGetGeneralSettingsQuery, useGetPaymentOptionsQuery, useGetPaymentsQuery, useUpdatePaymentMutation } from '../../store/baseApi'
import { PaymentPrintIcon } from './PaymentReceiptModal'
import { printPaymentReceipt } from './paymentReceipt'
import './Payments.css'

const methods = { cash: 'Naqd', online: 'Click', bank: 'Bank', card: 'Karta' }
const money = (value) => `${Number(value || 0).toLocaleString('uz-UZ')} so‘m`

export function PaymentsPage({ currentEmployee }) {
  const [form] = Form.useForm()
  const [filters, setFilters] = useState({ search: '', method: '', from: '', to: '', period: dayjs().format('YYYY-MM') })
  const [draftSearch, setDraftSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const { data, isLoading, error } = useGetPaymentsQuery(filters)
  const { data: optionsData, isLoading: optionsLoading } = useGetPaymentOptionsQuery(undefined, { skip: !open })
  const { data: settingsData } = useGetGeneralSettingsQuery()
  const [createPayment, { isLoading: saving }] = useCreatePaymentMutation()
  const [updatePayment, { isLoading: updating }] = useUpdatePaymentMutation()
  const [deletePayment, { isLoading: deleting }] = useDeletePaymentMutation()
  const selectedContractId = Form.useWatch('contract', form)
  const selectedMethod = Form.useWatch('method', form)
  const selectedInstallmentId = Form.useWatch('installment', form)
  const contracts = optionsData?.contracts || []
  const selectableContracts = editingPayment ? contracts : contracts.filter((item) => item.balance > 0)
  const selected = contracts.find((item) => item._id === selectedContractId)
  const installments = (selected?.installments || []).filter((item) => editingPayment || item.paidAmount < item.amount)
  const selectedInstallment = installments.find((item) => item._id === selectedInstallmentId)
  const rows = useMemo(() => data?.payments || [], [data?.payments])
  const summary = data?.summary || {}
  const isOwner = ['owner', 'admin'].includes(currentEmployee?.role)
  const availableBalance = selectedInstallment ? Math.max(0, selectedInstallment.amount - selectedInstallment.paidAmount) + (editingPayment?.amount || 0) : 0

  const openForm = () => { setEditingPayment(null); form.setFieldsValue({ method: 'cash', amount: null, contract: undefined, installment: undefined, note: '' }); setOpen(true) }
  const openEdit = (payment) => { setEditingPayment(payment); form.setFieldsValue({ contract: payment.contract?.id, installment: payment.allocations?.[0]?.installment?.id, amount: payment.amount, method: payment.method, note: payment.note || '' }); setOpen(true) }
  const submit = async (values) => {
    try {
      if (editingPayment) { await updatePayment({ id: editingPayment.id, amount: Number(values.amount), method: values.method, note: values.note }).unwrap(); toast.success('To‘lov yangilandi') }
      else { const result = await createPayment({ ...values, amount: Number(values.amount) }).unwrap(); printPaymentReceipt(result.payment, settingsData?.settings); toast.success('To‘lov muvaffaqiyatli qabul qilindi') }
      setOpen(false); setEditingPayment(null); form.resetFields()
    } catch (requestError) { toast.error(apiErrorMessage(requestError)) }
  }
  const remove = async (id) => { try { await deletePayment(id).unwrap(); toast.success('To‘lov bekor qilindi') } catch (requestError) { toast.error(apiErrorMessage(requestError)) } }

  return <div className="payments-page">
    <section className="payment-hero">
      <div><span className="payment-eyebrow">MOLIYAVIY BOSHQARUV</span><h2>To‘lovlar</h2><p>Talabalar to‘lovlarini qabul qiling va barcha tushumlarni kuzating.</p></div>
      <button className="payment-add" onClick={openForm}><span>+</span> To‘lov qabul qilish</button>
    </section>

    <section className="payment-stats">
      {[['total', 'Hisoblangan', money(summary.billed)], ['month', 'To‘langan', money(summary.paid)], ['debt', summary.isFuturePeriod ? 'Qarzdorlik boshlanmagan' : 'Qarzdorlik', money(summary.debt)], ['today', 'To‘lov qilgan', `${summary.paidStudents || 0} talaba`], ['unpaid', summary.isFuturePeriod ? 'To‘lov kutilmoqda' : 'To‘lov qilmagan', `${summary.isFuturePeriod ? summary.waitingStudents || 0 : summary.unpaidStudents || 0} talaba`]].map(([type, label, value]) => <article className={`payment-stat ${type}`} key={type}><small>{label}</small><strong>{value}</strong></article>)}
    </section>

    <section className="payment-card">
      <div className="payment-card-head"><div><h3>To‘lovlar tarixi</h3><p>{summary.count || 0} ta tranzaksiya</p></div></div>
      <div className="payment-filters">
        <div className="payment-search"><span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg></span><input value={draftSearch} placeholder="Talaba, telefon yoki shartnoma raqami" onChange={(e) => setDraftSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setFilters((old) => ({ ...old, search: draftSearch }))} /><button onClick={() => setFilters((old) => ({ ...old, search: draftSearch }))}>Qidirish</button></div>
        <Select allowClear placeholder="Barcha usullar" value={filters.method || undefined} onChange={(value) => setFilters((old) => ({ ...old, method: value || '' }))} options={Object.entries(methods).map(([value, label]) => ({ value, label }))} />
        <DatePicker picker="month" allowClear={false} value={dayjs(filters.period)} format="MMMM YYYY" onChange={(date) => setFilters((old) => ({ ...old, period: date.format('YYYY-MM') }))} />
        <DatePicker.RangePicker placeholder={['Boshlanish', 'Tugash']} onChange={(dates) => setFilters((old) => ({ ...old, from: dates?.[0]?.format('YYYY-MM-DD') || '', to: dates?.[1]?.format('YYYY-MM-DD') || '' }))} />
      </div>
      {error && <div className="form-error">{apiErrorMessage(error)}</div>}
      {isLoading ? <div className="payment-loader"><span /> To‘lovlar yuklanmoqda...</div> : <div className="payment-table-wrap"><table className="payment-table"><thead><tr><th>Talaba</th><th>Shartnoma</th><th>Qaysi oy uchun</th><th>Qabul qilingan sana</th><th>To‘lov usuli</th><th>Summa</th><th>Izoh</th><th /></tr></thead><tbody>
        {rows.map((payment) => <tr key={payment.id}><td data-label="Talaba"><strong>{payment.student?.fullName}</strong><small>{payment.student?.phone}</small></td><td data-label="Shartnoma"><span className="contract-pill">{payment.contract?.contractNumber}</span><small>{payment.contract?.room ? `${payment.contract.room.block || ''} ${payment.contract.room.roomNumber || ''}-xona` : ''}</small></td><td data-label="Oy"><span className="payment-period">{payment.allocations?.[0]?.installment?.periodKey || '—'}</span></td><td data-label="Sana">{dayjs(payment.createdAt).format('DD.MM.YYYY')}<small>{dayjs(payment.createdAt).format('HH:mm')}</small></td><td data-label="Usul"><span className={`method-badge ${payment.method}`}>{methods[payment.method]}</span></td><td data-label="Summa"><b className="payment-amount">+ {money(payment.amount)}</b></td><td data-label="Izoh">{payment.note || '—'}</td><td><div className="payment-row-actions"><button className="payment-receipt-btn" title="Chek" aria-label="To‘lov chekini chiqarish" onClick={() => printPaymentReceipt(payment, settingsData?.settings)}><PaymentPrintIcon /></button>{isOwner && <><button className="payment-edit" title="Tahrirlash" aria-label="To‘lovni tahrirlash" onClick={() => openEdit(payment)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4M4 20h16"/></svg></button><Popconfirm title="To‘lovni bekor qilish" description="Summa qarzdorlikka qaytariladi. Davom etasizmi?" okText="Bekor qilish" cancelText="Yo‘q" okButtonProps={{ danger: true, loading: deleting }} onConfirm={() => remove(payment.id)}><button className="payment-delete" title="O‘chirish">×</button></Popconfirm></>}</div></td></tr>)}
        {!rows.length && <tr><td className="payment-empty" colSpan="8"><span>₸</span><strong>To‘lov topilmadi</strong><p>Tanlangan oy uchun to‘lov mavjud emas.</p></td></tr>}
      </tbody></table></div>}
    </section>

    <Modal open={open} onCancel={() => { setOpen(false); setEditingPayment(null) }} footer={null} title={editingPayment ? 'To‘lovni tahrirlash' : 'Yangi to‘lov qabul qilish'} width={660} rootClassName="payment-modal" destroyOnHidden>
      <Form form={form} layout="vertical" requiredMark={false} onFinish={submit}>
        <Form.Item name="contract" label="Talaba va shartnoma" rules={[{ required: true, message: 'Talaba shartnomasini tanlang' }]}><Select disabled={Boolean(editingPayment)} showSearch loading={optionsLoading} optionFilterProp="label" placeholder="Talabani qidiring" onChange={() => form.setFieldsValue({ installment: undefined, amount: null })} options={selectableContracts.map((item) => ({ value: item._id, label: `${item.student?.fullName} — ${item.contractNumber} (${money(item.balance)} qoldiq)` }))} /></Form.Item>
        <Form.Item name="installment" label="Qaysi oy uchun" rules={[{ required: true, message: 'To‘lov oyini tanlang' }]}><Select disabled={!selected || Boolean(editingPayment)} placeholder="Oy yoki davrni tanlang" options={installments.map((item) => ({ value: item._id, label: `${item.periodKey} — ${money(Math.max(0, item.amount - item.paidAmount))} qoldiq` }))} /></Form.Item>
        {selected && <div className="selected-contract"><div><small>Talaba</small><b>{selected.student?.fullName}</b></div><div><small>Xona</small><b>{selected.room?.roomNumber || '—'}</b></div><div><small>Tanlangan oy qoldig‘i</small><b>{money(availableBalance)}</b></div></div>}
        <Form.Item name="amount" label="To‘lov summasi" rules={[{ required: true, message: 'Summani kiriting' }]}><InputNumber min={1} max={availableBalance || undefined} precision={0} placeholder="0" addonAfter="so‘m" formatter={(v) => String(v || '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} parser={(v) => String(v || '').replace(/[^\d]/g, '')} /></Form.Item>
        <Form.Item name="method" hidden rules={[{ required: true, message: 'To‘lov usulini tanlang' }]}><Input /></Form.Item>
        <div className="method-field"><label>To‘lov turi</label><div className="method-options">{Object.entries(methods).map(([value, label]) => <button type="button" className={selectedMethod === value ? 'active' : ''} key={value} onClick={() => form.setFieldValue('method', value)}>{label}</button>)}</div></div>
        <Form.Item name="note" label="Izoh"><Input placeholder="Ixtiyoriy" /></Form.Item>
        <div className="payment-modal-actions"><Button onClick={() => setOpen(false)}>Bekor qilish</Button><Button type="primary" htmlType="submit" loading={saving || updating}>{editingPayment ? 'Saqlash' : 'To‘lovni tasdiqlash'}</Button></div>
      </Form>
    </Modal>
  </div>
}
