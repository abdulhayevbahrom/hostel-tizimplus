import { useState } from 'react'
import { Button, Form, Input, InputNumber, Modal, Segmented, Select, Upload } from 'antd'
import { useGetBuildingBlocksQuery } from '../../store/baseApi'
import { categoryOptions, genderOptions } from './roomConstants'

const initialValues = { roomNumber: '', block: undefined, floor: '1', capacity: 4, category: undefined, gender: 'male', status: 'available', note: '' }

export function RoomFormModal({ open, room, loading, error, onClose, onSubmit }) {
  const [form] = Form.useForm()
  const [newImages, setNewImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const { data: blockData } = useGetBuildingBlocksQuery()
  const editing = Boolean(room)
  const blockOptions = (blockData?.blocks || []).map((item) => ({ value: item.name, label: item.name }))

  const prepareModal = (visible) => {
    if (!visible) return
    form.setFieldsValue(room || initialValues)
    setExistingImages(room?.images || [])
    setNewImages([])
  }

  return (
    <Modal open={open} onCancel={onClose} afterOpenChange={prepareModal} footer={null} destroyOnHidden width={760} rootClassName="hostel-room-modal" title={editing ? 'Xonani tahrirlash' : 'Yangi xona qo‘shish'}>
      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={(values) => onSubmit({ values, newImages, existingImages })} requiredMark={false}>
        <div className="room-form-grid">
          <Form.Item name="roomNumber" label="Xona raqami" rules={[{ required: true, whitespace: true, message: 'Xona raqami majburiy' }]}><Input placeholder="Masalan: 305" /></Form.Item>
          <Form.Item name="block" label="Bino yoki blok (ixtiyoriy)"><Select allowClear showSearch optionFilterProp="label" placeholder="Tanlanmagan" options={blockOptions} notFoundContent="Sozlamalardan bino yoki blok qo‘shing" /></Form.Item>
          <Form.Item name="floor" label="Qavat" rules={[{ required: true, whitespace: true, message: 'Qavatni kiriting' }]}><Input maxLength={30} placeholder="Masalan: -1" /></Form.Item>
          <Form.Item name="capacity" label="Xona sig‘imi" rules={[{ required: true, type: 'number', min: 1, message: 'Sig‘imni kiriting' }]}><InputNumber min={1} max={50} precision={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="category" label="Xona toifasi (ixtiyoriy)"><Select allowClear placeholder="Tanlanmagan" options={categoryOptions} /></Form.Item>
          <Form.Item name="gender" label="Kimlar uchun"><Select options={genderOptions} /></Form.Item>
        </div>
        <Form.Item label="Xona rasmlari">
          <div className="room-image-editor">
            {existingImages.map((image, index) => <div className="room-image-item" key={image.url}><img src={image.thumbnailUrl || image.url} alt={`Xona rasmi ${index + 1}`} /><button type="button" onClick={() => setExistingImages((items) => items.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}
            {existingImages.length + newImages.length < 8 && <Upload accept="image/jpeg,image/png,image/webp" listType="picture-card" fileList={newImages} multiple beforeUpload={() => false} onChange={({ fileList }) => setNewImages(fileList.slice(0, 8 - existingImages.length))}><div className="room-upload-button"><b>+</b><span>Rasm qo‘shish</span></div></Upload>}
          </div>
          <div className="room-image-help">JPG, PNG yoki WEBP · har biri 8 MB gacha · maksimal 8 ta</div>
        </Form.Item>
        {editing && <Form.Item name="status" label="Xona holati"><Segmented className="room-status-segmented" block options={[{ label: 'Aktiv', value: 'available' }, { label: 'Ta’mirda', value: 'maintenance' }]} /></Form.Item>}
        <Form.Item name="note" label="Izoh"><Input.TextArea rows={3} placeholder="Xona haqida qo‘shimcha ma’lumot" /></Form.Item>
        {error && <div className="form-error">{error}</div>}
        <div className="room-form-actions"><Button htmlType="submit" loading={loading} className="room-save-btn">{editing ? 'Yangilash' : 'Saqlash'}</Button><Button onClick={onClose}>Yopish</Button></div>
      </Form>
    </Modal>
  )
}
