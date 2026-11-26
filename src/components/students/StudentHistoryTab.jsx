import { useState } from 'react'
import { DatePicker, Pagination } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { apiErrorMessage, useGetStudentHistoryQuery, useUpdateStudentContractMutation } from '../../store/baseApi'
import { ContractFormModal } from './ContractFormModal'
import './StudentProfile.css'

const money = (value) => `${Number(value || 0).toLocaleString('uz-UZ')} so‘m`

export function StudentHistoryTab() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('')
  const [editing, setEditing] = useState(null)
  const [formError, setFormError] = useState('')
  const [updateContract, { isLoading: updating }] = useUpdateStudentContractMutation()
  const { data, isLoading, isFetching, error } = useGetStudentHistoryQuery({ page, ...(search ? { search } : {}), ...(month ? { month } : {}) })
  const pagination = data?.pagination || { page: 1, limit: 25, total: 0 }
  const close = () => { setEditing(null); setFormError('') }
  const submit = async (values) => {
    setFormError('')
    try {
      const result = await updateContract({ ...values, id: editing.contract.id, student: editing.student.id }).unwrap()
      toast.success(result.data?.contract?.status === 'active' ? 'Shartnoma qayta faollashtirildi' : 'Shartnoma yangilandi')
      close()
    } catch (requestError) {
      const message = apiErrorMessage(requestError)
      setFormError(message)
      toast.error(message)
    }
  }
  return <>
    <section className="student-history-card">
      <div className="student-history-tools">
        <div><h2>Talabalar tarixi</h2><p>Yashab ketgan {pagination.total} ta talaba</p></div>
        <div>
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Talaba, telefon, JSHR, xona yoki shartnoma" />
          <DatePicker picker="month" allowClear value={month ? dayjs(month) : null} format="MMMM YYYY" placeholder="Ketgan oy" onChange={(value) => { setMonth(value ? value.format('YYYY-MM') : ''); setPage(1) }} />
        </div>
      </div>
      {error && <div className="form-error">{apiErrorMessage(error)}</div>}
      {isLoading ? <div className="student-history-state">Talabalar tarixi yuklanmoqda…</div> :
        <div className={`student-history-table-wrap ${isFetching ? 'refreshing' : ''}`}>
          <table className="student-history-table">
            <thead><tr><th>Talaba</th><th>Universitet</th><th>Yashagan xona</th><th>Shartnoma</th><th>Kirgan sana</th><th>Ketgan sana</th><th>Yashagan muddat</th><th>Shartnoma summasi</th><th>Holat</th><th>Amal</th></tr></thead>
            <tbody>{(data?.rows || []).map(({ student, contract }) => {
              const exitDate = contract.cancelledAt || contract.endDate
              const duration = Math.max(1, dayjs(exitDate).diff(dayjs(contract.startDate), 'day'))
              const status = contract.status === 'cancelled' ? 'cancelled' : 'completed'
              return <tr key={student.id}>
                <td data-label="Talaba"><div className="history-person">
                  {student.photo ? <img src={student.photo.thumbnailUrl || student.photo.url} alt="" /> : <span>{student.fullName?.[0]}</span>}
                  <div><Link to={`/student/${student.id}`}>{student.fullName}</Link><small>{student.phone}</small></div>
                </div></td>
                <td data-label="Universitet"><strong>{student.university?.shortName || student.university?.name || '—'}</strong><small>{student.course}-kurs · {student.faculty?.name || '—'}</small></td>
                <td data-label="Xona"><strong>{contract.room ? `${contract.room.block} · ${contract.room.roomNumber}-xona` : '—'}</strong><small>{contract.room ? `${contract.room.floor}-qavat` : ''}{contract.bedNumber ? ` · ${contract.bedNumber}-o‘rin` : ''}</small></td>
                <td data-label="Shartnoma"><strong>{contract.contractNumber}</strong><small>{contract.paymentType === 'daily' ? 'Kunlik' : 'Oylik'}</small></td>
                <td data-label="Kirgan sana"><strong>{dayjs(contract.startDate).format('DD.MM.YYYY')}</strong></td>
                <td data-label="Ketgan sana"><strong>{dayjs(exitDate).format('DD.MM.YYYY')}</strong></td>
                <td data-label="Muddat"><span className="history-duration">{duration} kun</span></td>
                <td data-label="Summa"><b>{money(contract.totalAmount)}</b></td>
                <td data-label="Holat"><span className={`history-contract-status ${status}`}>{status === 'cancelled' ? 'Bekor qilingan' : 'Yakunlangan'}</span></td>
                <td data-label="Amal"><button type="button" className="student-history-edit" disabled={updating}
                  aria-label={`${student.fullName} shartnomasini tahrirlash`}
                  onClick={() => { setEditing({ student, contract }); setFormError('') }}><EditOutlined /> Tahrirlash</button></td>
              </tr>
            })}{!data?.rows?.length && <tr><td colSpan="10" className="student-history-state">Tanlangan filtr bo‘yicha tarix topilmadi</td></tr>}</tbody>
          </table>
        </div>}
      {pagination.total > 25 && <div className="student-history-pagination"><span>Jami {pagination.total} ta talaba</span><Pagination current={pagination.page} pageSize={25} total={pagination.total} showSizeChanger={false} onChange={setPage} /></div>}
    </section>
    <ContractFormModal open={Boolean(editing)} contract={editing?.contract} studentGender={editing?.student.gender}
      loading={updating} error={formError} onClose={close} onSubmit={submit} />
  </>
}
