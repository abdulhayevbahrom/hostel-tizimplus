import { useState } from 'react'
import { Button, Empty, Input, Modal, Pagination, Select, Tag } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, EyeOutlined, InboxOutlined, SearchOutlined } from '@ant-design/icons'
import { toast } from 'react-toastify'
import { apiErrorMessage, useGetComplaintsQuery, useUpdateComplaintMutation } from '../../store/baseApi'
import './Complaints.css'

const statusOptions = [
  { value: 'new', label: 'Yangi' },
  { value: 'in_progress', label: 'Jarayonda' },
  { value: 'resolved', label: 'Bajarildi' },
]
const statusMeta = {
  new: { label: 'Yangi', color: 'blue' },
  in_progress: { label: 'Jarayonda', color: 'gold' },
  resolved: { label: 'Bajarildi', color: 'green' },
}
const employeeName = (employee) => employee ? `${employee.firstname || ''} ${employee.lastname || ''}`.trim() : 'Biriktirilmagan'

export function ComplaintsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [editStatus, setEditStatus] = useState('new')
  const [staffNote, setStaffNote] = useState('')
  const { data, isLoading, isFetching, error } = useGetComplaintsQuery({ page, ...(search ? { search } : {}), ...(status ? { status } : {}) })
  const [updateComplaint, { isLoading: updating }] = useUpdateComplaintMutation()
  const summary = data?.summary || {}
  const openComplaint = (complaint) => { setSelected(complaint); setEditStatus(complaint.status); setStaffNote(complaint.staffNote || '') }
  const save = async () => {
    try {
      await updateComplaint({ id: selected.id, status: editStatus, staffNote }).unwrap()
      toast.success('Shikoyat holati yangilandi'); setSelected(null)
    } catch (requestError) { toast.error(apiErrorMessage(requestError)) }
  }
  return <div className="complaints-page">
    <section className="complaints-heading"><div><span>Murojaatlar markazi</span><h2>Talabalar shikoyatlari</h2><p>Telegram bot orqali kelgan muammolarni kuzating va bajarilish holatini boshqaring.</p></div><div className="complaint-live"><i /> Jonli yangilanadi</div></section>
    <section className="complaint-summary">
      <article><span className="complaint-stat-icon all"><InboxOutlined /></span><div><small>Jami shikoyat</small><strong>{summary.total || 0}</strong></div></article>
      <article><span className="complaint-stat-icon new"><InboxOutlined /></span><div><small>Yangi</small><strong>{summary.new || 0}</strong></div></article>
      <article><span className="complaint-stat-icon progress"><ClockCircleOutlined /></span><div><small>Jarayonda</small><strong>{summary.in_progress || 0}</strong></div></article>
      <article><span className="complaint-stat-icon done"><CheckCircleOutlined /></span><div><small>Bajarildi</small><strong>{summary.resolved || 0}</strong></div></article>
    </section>
    <section className="complaints-panel">
      <div className="complaint-tools"><div><h3>Shikoyatlar ro‘yxati</h3><p>Jami {data?.pagination?.total || 0} ta natija</p></div><div><Input allowClear prefix={<SearchOutlined />} value={search} placeholder="Talaba yoki matn bo‘yicha" onChange={(event) => { setSearch(event.target.value); setPage(1) }} /><Select allowClear value={status || undefined} placeholder="Barcha holatlar" options={statusOptions} onChange={(value = '') => { setStatus(value); setPage(1) }} /></div></div>
      {error && <div className="form-error">{apiErrorMessage(error)}</div>}
      {isLoading ? <div className="complaint-state">Shikoyatlar yuklanmoqda…</div> : <div className={`complaint-list ${isFetching ? 'refreshing' : ''}`}>
        {(data?.complaints || []).map((complaint) => <article className={`complaint-row ${complaint.status}`} key={complaint.id}>
          <div className="complaint-avatar">{complaint.student?.fullName?.charAt(0) || '?'}</div>
          <div className="complaint-main"><div className="complaint-person"><strong>{complaint.student?.fullName || 'Noma’lum talaba'}</strong><span>+998 {complaint.student?.phone}</span></div><p>{complaint.text}</p><div className="complaint-meta"><span>#{complaint.id.slice(-6).toUpperCase()}</span><time>{new Date(complaint.createdAt).toLocaleString('uz-UZ')}</time>{complaint.handledBy && <span>Mas’ul: {employeeName(complaint.handledBy)}</span>}</div></div>
          <div className="complaint-side"><Tag color={statusMeta[complaint.status].color}>{statusMeta[complaint.status].label}</Tag><Button icon={<EyeOutlined />} onClick={() => openComplaint(complaint)}>Ko‘rib chiqish</Button></div>
        </article>)}
        {!data?.complaints?.length && <div className="complaint-empty"><Empty description="Shikoyatlar topilmadi" /></div>}
      </div>}
      {(data?.pagination?.pages || 0) > 1 && <div className="complaint-pagination"><Pagination current={page} pageSize={data.pagination.limit} total={data.pagination.total} showSizeChanger={false} onChange={setPage} /></div>}
    </section>
    <Modal open={Boolean(selected)} width={620} title="Shikoyatni ko‘rib chiqish" onCancel={() => setSelected(null)} footer={<><Button onClick={() => setSelected(null)}>Bekor qilish</Button><Button type="primary" loading={updating} onClick={save}>Saqlash</Button></>}>
      {selected && <div className="complaint-detail">
        <div className="complaint-student-card"><div className="complaint-avatar large">{selected.student?.fullName?.charAt(0)}</div><div><strong>{selected.student?.fullName}</strong><span>+998 {selected.student?.phone} · #{selected.id.slice(-6).toUpperCase()}</span></div><Tag color={statusMeta[selected.status].color}>{statusMeta[selected.status].label}</Tag></div>
        <div className="complaint-message"><small>Talaba shikoyati</small><p>{selected.text}</p><time>{new Date(selected.createdAt).toLocaleString('uz-UZ')}</time></div>
        <label><span>Holati</span><Select value={editStatus} options={statusOptions} onChange={setEditStatus} /></label>
        <label><span>Xodim izohi</span><Input.TextArea rows={4} maxLength={2000} showCount value={staffNote} onChange={(event) => setStaffNote(event.target.value)} placeholder="Ko‘rilgan chora yoki bajarilgan ishni yozing" /></label>
      </div>}
    </Modal>
  </div>
}
