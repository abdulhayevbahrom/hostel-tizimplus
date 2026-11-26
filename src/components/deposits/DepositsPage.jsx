import { useMemo, useState } from 'react'
import { Pagination, Select } from 'antd'
import { EditOutlined, HistoryOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { apiErrorMessage, useGetDepositsQuery, useGetRoomsQuery } from '../../store/baseApi'
import { DepositManagementModal } from './DepositManagementModal'
import './Deposits.css'

const money = (value) => `${Number(value || 0).toLocaleString('uz-UZ')} so‘m`
const statusLabels = { paid: 'To‘langan', partial: 'Qisman to‘langan', unpaid: 'To‘lanmagan', refunded: 'Qaytarilgan', partially_refunded: 'Qisman qaytarilgan', disabled: 'Yoqilmagan', cancelled: 'Bekor qilingan' }

export function DepositsPage({ currentEmployee }) {
  const [selected, setSelected] = useState(null)
  const isOwner = ['owner', 'admin'].includes(currentEmployee?.role)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [room, setRoom] = useState()
  const [page, setPage] = useState(1)
  const params = useMemo(() => ({ page, ...(query.trim() ? { search: query.trim() } : {}), ...(status !== 'all' ? { status } : {}), ...(room ? { room } : {}) }), [page, query, room, status])
  const { data, isLoading, isFetching, error } = useGetDepositsQuery(params)
  const { data: roomsData } = useGetRoomsQuery()
  const deposits = data?.deposits || []
  const summary = data?.summary || {}
  const pagination = data?.pagination || { page: 1, limit: 30, total: 0 }
  const selectedItem = selected ? deposits.find((item) => item.contract.id === selected.item.contract.id) || selected.item : null
  const roomOptions = useMemo(() => (roomsData?.rooms || []).map((item) => ({ value: item.id, label: `${item.block ? `${item.block} blok · ` : ''}${item.roomNumber}-xona · ${item.floor}-qavat` })), [roomsData?.rooms])

  return <div className="deposits-page">
    <section className="deposits-hero"><div><span>DEPOSIT NAZORATI</span><h2>Talabalar depositlari</h2><p>Deposit shartnoma qarzdorligidan alohida hisoblanadi.</p></div><strong>{summary.studentCount || 0} ta talaba</strong></section>
    <section className="deposit-stats">
      <article className="total"><small>Jami depositlar</small><strong>{money(summary.totalDeposits)}</strong><span>{summary.studentCount || 0} ta talaba uchun</span></article>
      <article className="paid"><small>Umumiy to‘langan deposit</small><strong>{money(summary.paidDeposits)}</strong><span>{summary.paidCount || 0} ta to‘liq to‘lagan</span></article>
      <article className="held"><small>Saqlanayotgan deposit</small><strong>{money(summary.heldDeposits)}</strong><span>Qaytarilgan: {money(summary.refundedDeposits)}</span></article>
      <article className="unpaid"><small>To‘lanmagan deposit</small><strong>{money(summary.unpaidDeposits)}</strong><span>{summary.unpaidCount || 0} ta to‘lamagan · {summary.partialCount || 0} ta qisman</span></article>
    </section>
    <section className="deposits-card">
      <div className="deposits-head"><div><h3>Deposit holati</h3><p>Har bir shartnoma uchun ixtiyoriy deposit</p></div><div className="deposit-filters">
        <div className="deposit-search"><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Talaba, telefon, xona yoki shartnoma" /></div>
        <Select allowClear showSearch optionFilterProp="label" value={room} placeholder="Xona bo‘yicha" options={roomOptions} onChange={(value) => { setRoom(value); setPage(1) }} />
        <Select value={status} onChange={(value) => { setStatus(value); setPage(1) }} options={[{ value: 'all', label: 'Barcha holatlar' }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))]} />
      </div></div>
      {error && <div className="form-error">{apiErrorMessage(error)}</div>}
      {isLoading ? <div className="deposit-state">Ma’lumotlar yuklanmoqda…</div> : <div className={`deposit-table-wrap ${isFetching ? 'refreshing' : ''}`}>
        <table className="deposit-table"><thead><tr><th>Talaba</th><th>Universitet</th><th>Xona</th><th>Shartnoma</th><th>Deposit summasi</th><th>To‘langan</th><th>Qaytarilgan</th><th>Saqlanmoqda</th><th>Qoldiq</th><th>Holati</th><th>Amal</th></tr></thead><tbody>
          {deposits.map((item) => <tr key={item.contract.id}>
            <td data-label="Talaba"><div className="deposit-student">{item.student.photo ? <img src={item.student.photo.thumbnailUrl || item.student.photo.url} alt="" /> : <span>{item.student.fullName?.[0]}</span>}<div><button className="deposit-student-link" onClick={() => navigate(`/student/${item.student.id}`)}>{item.student.fullName}</button><small>{item.student.phone || '—'}</small></div></div></td>
            <td data-label="Universitet"><strong>{item.student.university?.name || '—'}</strong><small>{item.student.faculty?.name || ''}{item.student.course ? ` · ${item.student.course}-kurs` : ''}</small></td>
            <td data-label="Xona">{item.room ? <><strong>{item.room.block} · {item.room.roomNumber}-xona</strong><small>{item.room.floor}-qavat</small></> : '—'}</td>
            <td data-label="Shartnoma"><strong>{item.contract?.contractNumber || '—'}</strong></td>
            <td data-label="Deposit">{money(item.depositAmount)}</td>
            <td data-label="To‘langan"><b className="deposit-paid-money">{money(item.depositPaid)}</b></td>
            <td data-label="Qaytarilgan">{money(item.depositRefunded)}</td><td data-label="Saqlanmoqda"><strong>{money(item.depositHeld)}</strong></td>
            <td data-label="Qoldiq"><b className={item.depositRemaining ? 'deposit-unpaid-money' : ''}>{money(item.depositRemaining)}</b></td>
            <td data-label="Holati"><span className={`deposit-status ${item.depositStatus}`}>{statusLabels[item.depositStatus]}</span></td>
            <td data-label="Amal"><div className="deposit-table-actions">
              <button type="button" className="deposit-icon-btn" aria-label="Deposit tarixi va amallari" title="Deposit tarixi va amallari" onClick={() => setSelected({ item, mode: 'history' })}><HistoryOutlined /></button>
              {isOwner && <button type="button" className="deposit-icon-btn" aria-label={item.contract.depositEnabled ? 'Depositni tahrirlash' : 'Deposit belgilash'} title={item.contract.depositEnabled ? 'Depositni tahrirlash' : 'Deposit belgilash'} onClick={() => setSelected({ item, mode: 'policy' })}>{item.contract.depositEnabled ? <EditOutlined /> : <PlusOutlined />}</button>}
            </div></td>
          </tr>)}
          {!deposits.length && <tr><td colSpan="11" className="deposit-state">Tanlangan filtr bo‘yicha ma’lumot topilmadi</td></tr>}
        </tbody></table>
        {pagination.total > pagination.limit && <div className="deposit-pagination"><Pagination current={pagination.page} pageSize={pagination.limit} total={pagination.total} showSizeChanger={false} disabled={isFetching} onChange={setPage} /></div>}
      </div>}
    </section>
    {selectedItem && <DepositManagementModal key={selectedItem.contract.id} item={selectedItem} mode={selected.mode} defaultAmount={summary.depositAmount} currentEmployee={currentEmployee} onClose={() => setSelected(null)} />}
  </div>
}
