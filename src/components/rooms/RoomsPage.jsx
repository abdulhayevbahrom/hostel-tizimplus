import { useMemo, useState } from 'react'
import { Image, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { apiErrorMessage, useCreateRoomMutation, useDeleteRoomMutation, useGetRoomsQuery, useGetRoomStudentsQuery, useUpdateRoomMutation } from '../../store/baseApi'
import { RoomCard } from './RoomCard'
import { RoomFormModal } from './RoomFormModal'
import { categoryOptions, genderOptions, statusOptions } from './roomConstants'
import './Rooms.css'

export function RoomsPage() {
  const navigate = useNavigate()
  const { data, isLoading, error: listError } = useGetRoomsQuery()
  const [createRoom, { isLoading: creating }] = useCreateRoomMutation()
  const [updateRoom, { isLoading: updating }] = useUpdateRoomMutation()
  const [deleteRoom, { isLoading: deleting }] = useDeleteRoomMutation()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [floor, setFloor] = useState(undefined)
  const [category, setCategory] = useState(undefined)
  const [gender, setGender] = useState(undefined)
  const [status, setStatus] = useState(undefined)
  const [galleryRoom, setGalleryRoom] = useState(null)
  const [residentsRoom, setResidentsRoom] = useState(null)
  const { data: residentsData, isLoading: residentsLoading, error: residentsError } = useGetRoomStudentsQuery(residentsRoom?.id, { skip: !residentsRoom })
  const rooms = useMemo(() => data?.rooms || [], [data?.rooms])
  const floors = useMemo(() => [...new Set(rooms.map((room) => room.floor))].sort((a, b) => a - b).map((value) => ({ value, label: `${value}-qavat` })), [rooms])
  const filtered = useMemo(() => rooms.filter((room) => {
    const text = query.trim().toLowerCase()
    return (!text || [room.roomNumber, room.block, room.category].some((value) => String(value).toLowerCase().includes(text))) && (!floor || room.floor === floor) && (!category || room.category === category) && (!gender || room.gender === gender) && (!status || room.status === status)
  }), [rooms, query, floor, category, gender, status])

  const closeModal = () => { setModalOpen(false); setEditingRoom(null); setError('') }
  const submit = async ({ values, newImages, existingImages }) => {
    try {
      setError('')
      const formData = new FormData()
      formData.append('payload', JSON.stringify({ ...values, images: existingImages }))
      newImages.forEach((item) => formData.append('images', item.originFileObj))
      if (editingRoom) await updateRoom({ id: editingRoom.id, body: formData }).unwrap()
      else await createRoom(formData).unwrap()
      toast.success(editingRoom ? 'Xona yangilandi' : 'Xona qo‘shildi')
      closeModal()
    } catch (requestError) { setError(apiErrorMessage(requestError)) }
  }
  const remove = async (id) => {
    try { await deleteRoom(id).unwrap(); toast.success('Xona o‘chirildi') }
    catch (requestError) { toast.error(apiErrorMessage(requestError)) }
  }

  return (
    <div className="rooms-page">
      <div className="rooms-panel">
        <div className="rooms-toolbar">
          <h2>Xonalar ro‘yxati</h2>
          <div className="room-filters">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Qidirish: xona raqami, blok" />
            <Select size="large" allowClear classNames={{ popup: { root: 'room-filter-dropdown' } }} placeholder="Qavat" options={floors} value={floor} onChange={setFloor} />
            <Select size="large" allowClear classNames={{ popup: { root: 'room-filter-dropdown' } }} placeholder="Kategoriya" options={categoryOptions} value={category} onChange={setCategory} />
            <Select size="large" allowClear classNames={{ popup: { root: 'room-filter-dropdown' } }} placeholder="Kimlar uchun" options={genderOptions} value={gender} onChange={setGender} />
            <Select size="large" allowClear classNames={{ popup: { root: 'room-filter-dropdown' } }} placeholder="Status" options={statusOptions} value={status} onChange={setStatus} />
            <button className="add-room-btn" onClick={() => { setEditingRoom(null); setModalOpen(true) }}>+ Yangi xona</button>
          </div>
        </div>
        {listError && <div className="form-error">{apiErrorMessage(listError)}</div>}
        {isLoading ? <div className="rooms-loading">Xonalar yuklanmoqda…</div> : <div className="rooms-grid">{filtered.map((room) => <RoomCard key={room.id} room={room} deleting={deleting} onResidents={setResidentsRoom} onView={setGalleryRoom} onEdit={(item) => { setEditingRoom(item); setModalOpen(true) }} onDelete={remove} />)}{!filtered.length && <div className="rooms-empty">Xonalar topilmadi</div>}</div>}
      </div>
      <RoomFormModal open={modalOpen} room={editingRoom} loading={creating || updating} error={error} onClose={closeModal} onSubmit={submit} />
      <Modal open={Boolean(galleryRoom)} onCancel={() => setGalleryRoom(null)} footer={null} width={900} title={galleryRoom ? `Xona ${galleryRoom.roomNumber} rasmlari` : ''} rootClassName="room-gallery-modal">
        {galleryRoom?.images?.length ? <Image.PreviewGroup><div className="room-gallery-grid">{galleryRoom.images.map((image, index) => <Image key={image.url} src={image.displayUrl || image.url} alt={`Xona rasmi ${index + 1}`} />)}</div></Image.PreviewGroup> : <div className="room-gallery-empty">Bu xona uchun hali rasm qo‘shilmagan</div>}
      </Modal>
      <Modal open={Boolean(residentsRoom)} onCancel={() => setResidentsRoom(null)} footer={null} width={820} title={residentsRoom ? `Xona ${residentsRoom.roomNumber} — biriktirilgan talabalar` : ''} rootClassName="room-residents-modal">
        {residentsError && <div className="form-error">{apiErrorMessage(residentsError)}</div>}
        {residentsLoading ? <div className="room-residents-state">Talabalar yuklanmoqda…</div> : <div className="room-residents-table-wrap"><table className="room-residents-table"><thead><tr><th>Talaba</th><th>Shartnoma</th><th>Muddati</th></tr></thead><tbody>{(residentsData?.students || []).map(({ student, contract }) => <tr key={contract.id}><td data-label="Talaba"><button className="room-resident-person" onClick={() => navigate(`/student/${student.id}`)} title="Talaba profilini ochish">{student.photo ? <img src={student.photo.thumbnailUrl || student.photo.url} alt="" /> : <span>{student.fullName?.[0]}</span>}<div><strong>{student.fullName}</strong><small>{student.phone}</small></div></button></td><td data-label="Shartnoma"><strong>{contract.contractNumber}</strong></td><td data-label="Muddati">{dayjs(contract.startDate).format('DD.MM.YYYY')}<small>{dayjs(contract.endDate).format('DD.MM.YYYY')} gacha</small></td></tr>)}{!residentsData?.students?.length && <tr><td colSpan="3" className="room-residents-state">Bu xonaga hali talaba biriktirilmagan</td></tr>}</tbody></table></div>}
      </Modal>
    </div>
  )
}
