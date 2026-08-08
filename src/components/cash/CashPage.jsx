import { useState } from 'react'
import { Button, Form, Input, InputNumber, Modal } from 'antd'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { apiErrorMessage, useApproveCashSessionMutation, useCloseCashSessionMutation, useGetCashSessionsQuery } from '../../store/baseApi'
import './Cash.css'
import './CashNotes.css'

const money = (value) => `${Number(value || 0).toLocaleString('uz-UZ')} so‘m`
const fullName = (employee) => `${employee?.firstname || ''} ${employee?.lastname || ''}`.trim() || '—'

export function CashPage({ currentEmployee }) {
  const [closeOpen, setCloseOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [closeForm] = Form.useForm()
  const [approveForm] = Form.useForm()
  const isCashier = currentEmployee?.role === 'cashier'
  const canReview = ['owner', 'admin'].includes(currentEmployee?.role)
  const { data, isLoading, error } = useGetCashSessionsQuery(undefined, { skip: !isCashier && !canReview })
  const [closeCash, { isLoading: closing }] = useCloseCashSessionMutation()
  const [approveCash, { isLoading: approving }] = useApproveCashSessionMutation()

  const submitClose = async (values) => {
    try {
      await closeCash({ note: values.note?.trim() || '' }).unwrap()
      toast.success('Kassa owner tasdig‘iga yuborildi')
      setCloseOpen(false); closeForm.resetFields()
    } catch (requestError) { toast.error(apiErrorMessage(requestError)) }
  }

  const openApprove = (session) => {
    setSelected(session)
    approveForm.setFieldsValue({ receivedAmount: session.expectedAmount, reviewNote: '' })
  }

  const submitApprove = async (values) => {
    try {
      await approveCash({ id: selected.id, receivedAmount: Number(values.receivedAmount), reviewNote: values.reviewNote?.trim() || '' }).unwrap()
      toast.success('Pul qabul qilindi va markaziy kassaga o‘tkazildi')
      setSelected(null); approveForm.resetFields()
    } catch (requestError) { toast.error(apiErrorMessage(requestError)) }
  }

  if (!isCashier && !canReview) return <div className="cash-loading">Bu bo‘lim faqat kassir va owner uchun ochiq.</div>
  if (isLoading) return <div className="cash-loading">Kassa ma’lumotlari yuklanmoqda…</div>
  if (error) return <div className="form-error">{apiErrorMessage(error)}</div>

  return <div className="cash-page">
    {isCashier ? <>
      <section className="cash-summary cashier-summary">
        <article><small>Ochiq kassada</small><strong>{money(data?.open?.balance)}</strong><span>{data?.open?.paymentCount || 0} ta naqd to‘lov</span></article>
        <article className="pending"><small>Tasdiqlanmagan summa</small><strong>{money(data?.pendingAmount)}</strong><span>Owner qabul qilishi kutilmoqda</span></article>
      </section>
      <section className="cash-card cash-close-card"><div><h2>Joriy kassani yopish</h2><p>Dasturdagi naqd summa bilan qo‘lingizdagi pulni solishtirib, ownerga yuboring.</p></div><Button type="primary" disabled={!data?.open?.balance} onClick={() => setCloseOpen(true)}>Kassani yopish</Button></section>
      <CashHistory sessions={data?.sessions || []} cashier={false} />
    </> : <>
      <section className="cash-summary">
        <article><small>Markaziy kassada</small><strong>{money(data?.summary?.centralCash)}</strong><span>Tasdiqlangan naqd pullar</span></article>
        <article className="pending"><small>Kassirlarda</small><strong>{money(data?.summary?.pendingAmount)}</strong><span>{data?.summary?.pendingCount || 0} ta kassa kutilmoqda</span></article>
        <article><small>To‘g‘ridan-to‘g‘ri</small><strong>{money(data?.summary?.directCash)}</strong><span>Owner qabul qilgan naqd to‘lov</span></article>
      </section>
      <section className="cash-card"><div className="cash-card-title"><h2>Tasdiqlash kutilayotgan kassalar</h2><p>Pulni sanang va haqiqiy summani kiriting.</p></div><CashTable sessions={data?.pendingSessions || []} onApprove={openApprove} /></section>
      <CashHistory sessions={data?.recentSessions || []} cashier />
    </>}

    <Modal open={closeOpen} onCancel={() => setCloseOpen(false)} footer={null} title="Kassani yopish" destroyOnHidden>
      <Form form={closeForm} layout="vertical" onFinish={submitClose} requiredMark={false}>
        <div className="cash-confirm-total"><span>Dastur bo‘yicha</span><strong>{money(data?.open?.balance)}</strong></div>
        <Form.Item name="note" label="Izoh"><Input.TextArea rows={3} maxLength={500} /></Form.Item>
        <div className="cash-modal-actions"><Button onClick={() => setCloseOpen(false)}>Bekor qilish</Button><Button type="primary" htmlType="submit" loading={closing}>Ownerga yuborish</Button></div>
      </Form>
    </Modal>
    <Modal open={Boolean(selected)} onCancel={() => setSelected(null)} footer={null} title="Kassani qabul qilish" destroyOnHidden>
      <Form form={approveForm} layout="vertical" onFinish={submitApprove} requiredMark={false}>
        <div className="cash-confirm-total"><span>Dastur bo‘yicha</span><strong>{money(selected?.expectedAmount)}</strong></div>
        <div className="cash-sent-note"><span>Kassir izohi</span><p>{selected?.note || 'Izoh yozilmagan'}</p></div>
        <Form.Item name="receivedAmount" label="Sanalgan haqiqiy summa" rules={[{ required: true, message: 'Summani kiriting' }]}><InputNumber min={0} precision={0} addonAfter="so‘m" style={{ width: '100%' }} formatter={(value) => String(value || '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} parser={(value) => String(value || '').replace(/[^\d]/g, '')} /></Form.Item>
        <Form.Item name="reviewNote" label="Izoh"><Input.TextArea rows={2} maxLength={500} /></Form.Item>
        <div className="cash-modal-actions"><Button onClick={() => setSelected(null)}>Bekor qilish</Button><Button type="primary" htmlType="submit" loading={approving}>Qabul qilish</Button></div>
      </Form>
    </Modal>
  </div>
}

function CashTable({ sessions, onApprove }) {
  return <div className="cash-table-wrap"><table><thead><tr><th>Kassir</th><th>Yopilgan vaqt</th><th>To‘lovlar</th><th>Dasturdagi summa</th><th>Kassir izohi</th><th>Amal</th></tr></thead><tbody>{sessions.map((session) => <tr key={session.id}><td data-label="Kassir"><strong>{fullName(session.cashier)}</strong><small>{session.cashier?.position}</small></td><td data-label="Vaqt">{dayjs(session.closedAt).format('DD.MM.YYYY HH:mm')}</td><td data-label="To‘lovlar">{session.paymentCount} ta</td><td data-label="Summa"><b>{money(session.expectedAmount)}</b></td><td data-label="Kassir izohi"><span className="cash-note">{session.note || '—'}</span></td><td data-label="Amal"><Button size="small" type="primary" onClick={() => onApprove(session)}>Pulni qabul qilish</Button></td></tr>)}{!sessions.length && <tr><td colSpan={6} className="cash-empty">Tasdiqlash kutilayotgan kassa yo‘q</td></tr>}</tbody></table></div>
}

function CashHistory({ sessions, cashier }) {
  return <section className="cash-card"><div className="cash-card-title"><h2>Kassa tarixi</h2><p>Yopilgan va qabul qilingan kassalar</p></div><div className="cash-table-wrap"><table><thead><tr>{cashier && <th>Kassir</th>}<th>Yopilgan vaqt</th><th>Summa</th><th>Kassir izohi</th><th>Admin izohi</th><th>Holat</th></tr></thead><tbody>{sessions.map((session) => <tr key={session.id}>{cashier && <td data-label="Kassir">{fullName(session.cashier)}</td>}<td data-label="Vaqt">{session.closedAt ? dayjs(session.closedAt).format('DD.MM.YYYY HH:mm') : '—'}</td><td data-label="Summa"><b>{money(session.expectedAmount)}</b></td><td data-label="Kassir izohi"><span className="cash-note">{session.note || '—'}</span></td><td data-label="Admin izohi"><span className="cash-note">{session.reviewNote || '—'}</span></td><td data-label="Holat"><span className={`cash-status ${session.status}`}>{session.status === 'approved' ? 'Qabul qilingan' : session.status === 'pending' ? 'Kutilmoqda' : 'Rad etilgan'}</span></td></tr>)}{!sessions.length && <tr><td colSpan={cashier ? 6 : 5} className="cash-empty">Kassa tarixi hali yo‘q</td></tr>}</tbody></table></div></section>
}
