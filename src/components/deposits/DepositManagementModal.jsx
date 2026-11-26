import { useState } from 'react'
import { Alert, Button, ConfigProvider, Form, Input, InputNumber, Modal, Popconfirm, Select, Switch } from 'antd'
import { ArrowLeftOutlined, CloseCircleOutlined, EditOutlined, HistoryOutlined, RollbackOutlined, SaveOutlined, WalletOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { apiErrorMessage, useGetDepositHistoryQuery, useGetPaymentOptionsQuery, useUpdateDepositMutation, useCancelDepositMutation, useCreateDepositRefundMutation, useUpdateDepositRefundMutation, useCancelDepositRefundMutation, useCreatePaymentMutation, useUpdatePaymentMutation, useDeletePaymentMutation } from '../../store/baseApi'
import { PaymentDateFields } from '../payments/PaymentDateFields'
import { formatPaymentDate, paymentDateFields } from '../../utils/paymentDate'
import { breakdownTotal, effectivePaymentParts, paymentBreakdown, paymentMethods } from '../../utils/paymentParts'
import '../payments/Payments.css'
import './DepositManagementModal.css'

const money = (value) => `${Number(value || 0).toLocaleString('uz-UZ')} so‘m`
const actor = (employee) => employee ? `${employee.firstname || ''} ${employee.lastname || ''}`.trim() : '—'
const moneyInput = { min: 0, precision: 0, addonAfter: 'so‘m', style: { width: '100%' }, formatter: (value) => String(value || '').replace(/\B(?=(\d{3})+(?!\d))/g, ' '), parser: (value) => String(value || '').replace(/\D/g, '') }
const depositTheme = { token: { colorPrimary: '#0f766e', colorText: '#263f49', colorBorder: '#b7cdd2', colorBgContainer: '#f8fafb', borderRadius: 8, controlHeight: 42 }, components: { Switch: { trackHeight: 26, trackMinWidth: 44, handleSize: 22 } } }
const titles = { policy: 'Depositni belgilash', payment: 'Deposit to‘lash', refund: 'Deposit qaytarish', history: 'Deposit tarixi' }

function Changes({ history = [] }) {
  if (!history.length) return null
  return <details className="deposit-audit"><summary>O‘zgarishlar tarixi ({history.length})</summary>{history.map((row, index) => <p key={row._id || index}>
    <strong>{actor(row.performedBy)}</strong> · {dayjs(row.performedAt).format('DD.MM.YYYY HH:mm')} · {({ created: 'Yaratildi', updated: 'Tahrirlandi', cancelled: 'Bekor qilindi' })[row.action]}
    {row.before?.amount != null && <> · {money(row.before.amount)}</>}{row.after?.amount != null && <> → {money(row.after.amount)}</>}
    {(row.after?.method || row.before?.method) && <> · {paymentMethods[row.after?.method || row.before?.method]}</>}
    {(row.after?.paymentPeriod || row.before?.paymentPeriod) && <> · {row.after?.paymentPeriod || row.before?.paymentPeriod}</>}
    {row.note && <> · {row.note}</>}
  </p>)}</details>
}

export function DepositManagementModal({ item, mode: initialMode = 'history', defaultAmount = 0, currentEmployee, onClose }) {
  const [mode, setMode] = useState(initialMode)
  const [editing, setEditing] = useState(null)
  const [requestError, setRequestError] = useState('')
  const [form] = Form.useForm()
  const contractId = item.contract.id
  const { data: history, isLoading, error } = useGetDepositHistoryQuery(contractId)
  const { data: optionsData } = useGetPaymentOptionsQuery()
  const contract = optionsData?.contracts?.find((row) => row._id === contractId)
  const installments = contract?.installments || history?.installments || []
  const periods = [...new Set(installments.map((row) => row.periodKey))]
  const [updateDeposit, updateState] = useUpdateDepositMutation()
  const [cancelDeposit, cancelState] = useCancelDepositMutation()
  const [createRefund, createRefundState] = useCreateDepositRefundMutation()
  const [updateRefund, updateRefundState] = useUpdateDepositRefundMutation()
  const [cancelRefund, cancelRefundState] = useCancelDepositRefundMutation()
  const [createPayment, createPaymentState] = useCreatePaymentMutation()
  const [updatePayment, updatePaymentState] = useUpdatePaymentMutation()
  const [cancelPayment, cancelPaymentState] = useDeletePaymentMutation()
  const busy = [updateState, cancelState, createRefundState, updateRefundState, cancelRefundState, createPaymentState, updatePaymentState, cancelPaymentState].some((state) => state.isLoading)
  const isOwner = ['owner', 'admin'].includes(currentEmployee?.role)
  const enabled = Form.useWatch('depositEnabled', form)
  const breakdown = Form.useWatch('breakdown', form) || {}
  const enteredTotal = breakdownTotal(breakdown)
  const activePayments = (history?.payments || []).filter((row) => row.status !== 'cancelled' && !row.cancelledAt)
  const paid = activePayments.reduce((sum, row) => sum + row.amount, 0)
  const refunded = (history?.refunds || []).filter((row) => row.status !== 'cancelled').reduce((sum, row) => sum + row.amount, 0)
  const held = Math.max(0, paid - refunded)
  const paymentBalance = !item.contract.depositEnabled ? Number(editing?.amount || 0)
    : Math.max(0, item.depositAmount - paid + (mode === 'payment' ? editing?.amount || 0 : 0))
  const refundBalance = held + (mode === 'refund' ? editing?.amount || 0 : 0)

  const switchMode = (nextMode, row = null) => {
    setMode(nextMode); setEditing(row); setRequestError(''); form.resetFields()
    if (nextMode === 'policy') form.setFieldsValue({ depositEnabled: item.contract.depositEnabled, depositAmount: item.contract.depositEnabled ? item.depositAmount : defaultAmount })
    if (nextMode === 'payment') form.setFieldsValue({ depositPeriod: row?.depositPeriod || undefined, breakdown: row ? paymentBreakdown(row) : {}, ...paymentDateFields(row?.paymentDate || row?.createdAt), note: row?.note || '', fundHolder: effectivePaymentParts(row || {}).find((part) => ['card', 'online'].includes(part.method))?.fundHolder || 'organization' })
    if (nextMode === 'refund') form.setFieldsValue({ amount: row?.amount || held, method: row?.method || 'cash', ...paymentDateFields(row?.refundDate), note: row?.note || '' })
  }
  const perform = async (action, message, close = false) => {
    try { setRequestError(''); await action().unwrap(); toast.success(message); if (close) onClose(); else switchMode('history') }
    catch (err) { setRequestError(apiErrorMessage(err)) }
  }
  const submit = (values) => {
    if (mode === 'policy') return perform(() => updateDeposit({ id: contractId, depositEnabled: values.depositEnabled === true, depositAmount: values.depositAmount, note: values.note }), 'Deposit yangilandi')
    if (mode === 'refund') {
      const body = { id: editing?.id || contractId, amount: values.amount, method: values.method, refundDate: formatPaymentDate(values.paymentDate, values.paymentTime), note: values.note }
      return perform(() => editing ? updateRefund(body) : createRefund(body), editing ? 'Qaytarish yangilandi' : 'Deposit qaytarildi')
    }
    const installment = installments.find((row) => row.periodKey === values.depositPeriod)?._id
    const body = { id: editing?.id, paymentPurpose: 'deposit', contract: contractId, installment, breakdown: values.breakdown, fundHolder: values.fundHolder, paymentDate: formatPaymentDate(values.paymentDate, values.paymentTime), note: values.note }
    return perform(() => editing ? updatePayment(body) : createPayment(body), editing ? 'Deposit to‘lovi yangilandi' : 'Deposit to‘lovi qabul qilindi')
  }
  const initialValues = initialMode === 'policy' ? { depositEnabled: item.contract.depositEnabled, depositAmount: item.contract.depositEnabled ? item.depositAmount : defaultAmount }
    : initialMode === 'refund' ? { amount: item.depositHeld, method: 'cash', ...paymentDateFields() } : { breakdown: {}, fundHolder: 'organization', ...paymentDateFields() }

  return <ConfigProvider theme={depositTheme}><Modal open centered title={<div className="deposit-modal-heading"><span className="deposit-modal-symbol"><WalletOutlined /></span><div><strong>{item.student.fullName}</strong><small>{item.contract.contractNumber} · Deposit boshqaruvi</small></div></div>} onCancel={busy ? undefined : onClose} closable={!busy} mask={{ closable: !busy }} keyboard={!busy} footer={null} width={860} rootClassName="deposit-management-modal" destroyOnHidden>
    <div className="deposit-dialog-summary">
      <div><span>Belgilangan deposit</span><b>{money(item.depositAmount)}</b></div>
      <div className="paid"><span>To‘langan</span><b>{money(paid)}</b></div>
      <div className="refunded"><span>Qaytarilgan</span><b>{money(refunded)}</b></div>
      <div className="held"><span>Saqlanmoqda</span><b>{money(held)}</b></div>
    </div>
    <div className="deposit-dialog-tabs">
      <Button icon={<HistoryOutlined />} disabled={busy} type={mode === 'history' ? 'primary' : 'default'} aria-pressed={mode === 'history'} onClick={() => switchMode('history')}>Tarix</Button>
      {isOwner && <Button icon={<EditOutlined />} disabled={busy} type={mode === 'policy' ? 'primary' : 'default'} aria-pressed={mode === 'policy'} onClick={() => switchMode('policy')}>Depositni belgilash</Button>}
      {item.contract.depositEnabled && item.contract.status === 'active' && <Button icon={<WalletOutlined />} type={mode === 'payment' ? 'primary' : 'default'} aria-pressed={mode === 'payment'} disabled={busy || item.depositRemaining <= 0} onClick={() => switchMode('payment')}>To‘lov qabul qilish</Button>}
      {isOwner && <Button icon={<RollbackOutlined />} type={mode === 'refund' ? 'primary' : 'default'} aria-pressed={mode === 'refund'} disabled={busy || held <= 0} onClick={() => switchMode('refund')}>Qaytarish</Button>}
    </div>
    {(requestError || error) && <Alert type="error" showIcon title={requestError || apiErrorMessage(error)} />}
    {mode === 'history' ? <div className="deposit-ledger">
      {isLoading ? <p>Tarix yuklanmoqda…</p> : <>
        <h3><WalletOutlined /> Deposit to‘lovlari <span>{history?.payments?.length || 0}</span></h3>
        {(history?.payments || []).map((row) => <article key={row.id} className={`deposit-payment-entry ${row.status === 'cancelled' ? 'cancelled' : ''}`}>
          <div><strong>+ {money(row.amount)}</strong><span>{row.depositPeriod || 'Oy belgilanmagan'} · {dayjs(row.paymentDate || row.createdAt).format('DD.MM.YYYY HH:mm')}</span><span>Qabul qildi: {actor(row.receivedBy)}</span><span>{effectivePaymentParts(row).map((part) => `${paymentMethods[part.method]}: ${money(part.amount)}`).join(' · ')}</span>{row.note && <span>{row.note}</span>}</div>
          {row.status === 'cancelled' ? <span>Bekor qilingan · {actor(row.cancelledBy)}</span> : isOwner && <div className="deposit-row-actions"><Button className="deposit-ledger-icon" icon={<EditOutlined />} title="To‘lovni tahrirlash" aria-label="To‘lovni tahrirlash" disabled={busy} onClick={() => switchMode('payment', row)} /><Popconfirm title="Deposit to‘lovini bekor qilish?" description="Qaytarilgan pul bo‘lsa, avval qaytarishni tahrirlang." onConfirm={() => perform(() => cancelPayment(row.id), 'To‘lov bekor qilindi')} okText="Bekor qilish" cancelText="Yopish"><Button className="deposit-ledger-icon" icon={<CloseCircleOutlined />} title="Bekor qilish" aria-label="Bekor qilish" danger disabled={busy} /></Popconfirm></div>}
          <Changes history={row.auditHistory} />
        </article>)}
        {!history?.payments?.length && <div className="deposit-history-empty"><WalletOutlined /><p>Deposit hali to‘lanmagan</p></div>}
        <h3><RollbackOutlined /> Qaytarishlar <span>{history?.refunds?.length || 0}</span></h3>
        {(history?.refunds || []).map((row) => <article key={row.id} className={`deposit-refund-entry ${row.status === 'cancelled' ? 'cancelled' : ''}`}>
          <div><strong>− {money(row.amount)}</strong><span>{paymentMethods[row.method]} · {dayjs(row.refundDate).format('DD.MM.YYYY HH:mm')}</span><span>Qaytardi: {actor(row.refundedBy)}</span>{row.note && <span>{row.note}</span>}</div>
          {row.status === 'cancelled' ? <span>Bekor qilingan · {actor(row.cancelledBy)}</span> : isOwner && <div className="deposit-row-actions"><Button className="deposit-ledger-icon" icon={<EditOutlined />} title="Qaytarishni tahrirlash" aria-label="Qaytarishni tahrirlash" disabled={busy} onClick={() => switchMode('refund', row)} /><Popconfirm title="Qaytarishni bekor qilish?" description="Summa saqlanayotgan depositga qaytadi." onConfirm={() => perform(() => cancelRefund({ id: row.id }), 'Qaytarish bekor qilindi')} okText="Bekor qilish" cancelText="Yopish"><Button className="deposit-ledger-icon" icon={<CloseCircleOutlined />} title="Bekor qilish" aria-label="Bekor qilish" danger disabled={busy} /></Popconfirm></div>}
          <Changes history={row.auditHistory} />
        </article>)}
        {!history?.refunds?.length && <div className="deposit-history-empty"><RollbackOutlined /><p>Deposit qaytarilmagan</p></div>}
        <Changes history={history?.policyHistory} />
      </>}
    </div> : <Form className="deposit-editor" form={form} initialValues={initialValues} layout="vertical" requiredMark={false} disabled={busy || isLoading} onFinish={submit}>
      <h3>{editing ? (mode === 'refund' ? 'Qaytarishni tahrirlash' : 'Deposit to‘lovini tahrirlash') : titles[mode]}</h3>
      {mode === 'policy' && <>
        <div className="deposit-policy-toggle"><div><strong>Deposit olish</strong><p>Talaba uchun depositni yoqing va summani belgilang.</p></div><Form.Item name="depositEnabled" valuePropName="checked" noStyle><Switch aria-label="Depositni yoqish" onChange={(checked) => { if (checked) form.setFieldValue('depositAmount', item.depositAmount || defaultAmount) }} /></Form.Item></div>
        {enabled && <Form.Item name="depositAmount" label="Deposit summasi" rules={[{ required: true, type: 'number', min: Math.max(1, paid), message: `Summa to‘langan ${money(paid)}dan kam bo‘lmasin` }]}><InputNumber {...moneyInput} /></Form.Item>}
      </>}
      {mode === 'refund' && <>
        <Alert type="info" title={`Qaytarish mumkin: ${money(refundBalance)}`} description="Pul markaziy kassadan qaytariladi." />
        <Form.Item name="amount" label="Qaytariladigan summa" rules={[{ required: true, type: 'number', min: 1, max: refundBalance, message: `1 so‘mdan ${money(refundBalance)}gacha kiriting` }]}><InputNumber {...moneyInput} /></Form.Item>
        <Form.Item name="method" label="Qaysi to‘lov usulida" rules={[{ required: true, message: 'To‘lov usulini tanlang' }]}><Select options={Object.entries(paymentMethods).map(([value, label]) => ({ value, label }))} /></Form.Item>
        <PaymentDateFields />
      </>}
      {mode === 'payment' && <>
        <Form.Item name="depositPeriod" label="Deposit qaysi oy uchun" rules={[{ required: true, message: 'Shartnoma oyini tanlang' }]}><Select placeholder="Oyni tanlang" options={periods.map((period) => ({ value: period, label: period }))} /></Form.Item>
        <div className="deposit-payment-balance"><span>Deposit qoldig‘i</span><b>{money(paymentBalance)}</b></div>
        <div className="payment-split-grid">{Object.entries(paymentMethods).map(([value, label]) => <Form.Item name={['breakdown', value]} label={label} key={value}><InputNumber {...moneyInput} /></Form.Item>)}</div>
        <div className={`deposit-payment-balance total ${enteredTotal > paymentBalance ? 'invalid' : ''}`}><span>Jami to‘lov</span><b>{money(enteredTotal)}</b></div>
        {currentEmployee?.role === 'cashier' && <Form.Item name="fundHolder" label="Karta / Click puli qaysi hisobga tushdi?"><Select options={[{ value: 'organization', label: 'Tashkilot hisobiga' }, { value: 'cashier', label: 'Shaxsiy hisobimga' }]} /></Form.Item>}
        <PaymentDateFields />
      </>}
      <Form.Item name="note" label="Izoh"><Input.TextArea maxLength={500} rows={2} /></Form.Item>
      <div className="deposit-editor-actions"><Button icon={<SaveOutlined />} type="primary" htmlType="submit" loading={busy} disabled={mode === 'payment' && (enteredTotal <= 0 || enteredTotal > paymentBalance)}>Saqlash</Button><Button icon={<ArrowLeftOutlined />} disabled={busy} onClick={() => switchMode('history')}>Orqaga</Button>
        {mode === 'policy' && item.contract.depositEnabled && <Popconfirm title="Depositni bekor qilish?" description="Pul qaytarilmaydi. Qaytarish alohida amalga oshiriladi, tarix saqlanadi." onConfirm={() => perform(() => cancelDeposit({ id: contractId }), 'Deposit bekor qilindi')} okText="Bekor qilish" cancelText="Yopish"><Button className="deposit-cancel-policy" icon={<CloseCircleOutlined />} danger disabled={busy}>Depositni bekor qilish</Button></Popconfirm>}
      </div>
    </Form>}
  </Modal></ConfigProvider>
}
