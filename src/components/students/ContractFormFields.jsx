import { useState } from 'react'
import { Alert, Button, Spin, ConfigProvider, DatePicker, Form, Input, InputNumber, Segmented, Select, Switch } from 'antd'
import { apiErrorMessage, useGetContractRoomsQuery } from '../../store/baseApi'
import { calculateContractPayment } from '../../utils/contractPayment'

const depositSwitchTheme = { components: { Switch: {
  trackHeight: 26, trackMinWidth: 44, trackPadding: 2, handleSize: 22,
  colorPrimary: '#34c759', colorPrimaryHover: '#2db84e', colorTextQuaternary: '#cbd0d6',
  handleShadow: '0 1px 3px rgba(0, 0, 0, .2)',
} } }

function RoomPicker({ value, onChange, onRoomChange, rooms, disabled }) {
  if (!rooms.length) return <div className="contract-room-empty">Mos bo‘sh xona mavjud emas</div>
  return <div className="contract-room-picker">{rooms.map((room) => {
    const available = (room.availableBeds || []).length
    return <button type="button" key={room.id} className={value === room.id ? 'selected' : ''} aria-pressed={value === room.id} disabled={disabled} onClick={() => { onChange(room.id); onRoomChange?.() }}><strong>{room.roomNumber}-xona</strong><span>{room.block ? `${room.block} · ` : ''}{room.floor}-qavat</span><small title={`Bo‘sh o‘rinlar: ${(room.availableBeds || []).join(', ')}`}>{available} ta bo‘sh</small></button>
  })}</div>
}


function BedPicker({ value, onChange, beds, disabled }) {
  return <div className="contract-bed-picker" role="group" aria-label="Xonadagi o‘rinlar">
    {beds.map((bed) => <button type="button" key={bed.number} disabled={disabled || !bed.available}
      className={!bed.available ? 'occupied' : value === bed.number ? 'selected' : 'available'}
      aria-pressed={value === bed.number} aria-label={`${bed.number}-o‘rin: ${bed.available ? 'bo‘sh' : 'band'}`}
      title={bed.available ? `${bed.number}-o‘rin bo‘sh` : `${bed.number}-o‘rin band`}
      onClick={() => onChange(bed.number)}><strong>{bed.number}</strong><span>{bed.available ? 'Bo‘sh' : 'Band'}</span></button>)}
  </div>
}


export function ContractFormFields({ contract, studentGender, prefix = [], loading = false }) {
  const form = Form.useFormInstance()
  const field = (name) => [...prefix, name]
  const [floor, setFloor] = useState()
  const paymentType = Form.useWatch(field('paymentType'), form)
  const startDate = Form.useWatch(field('startDate'), form)
  const endDate = Form.useWatch(field('endDate'), form)
  const paymentAmount = Form.useWatch(field('paymentAmount'), form)
  const depositEnabled = Form.useWatch(field('depositEnabled'), form)
  const isCancelled = contract?.status === 'cancelled'
  const calculation = calculateContractPayment(startDate, endDate, paymentType, paymentAmount)
  const selectedRoomId = Form.useWatch(field('room'), form)
  const hasDates = Boolean(startDate?.isValid?.() && endDate?.isValid?.() && endDate.isAfter(startDate, 'day'))
  const { currentData: roomData, isFetching: roomsFetching, error: roomsError, refetch } = useGetContractRoomsQuery({
    startDate: hasDates ? startDate.format('YYYY-MM-DD') : undefined,
    endDate: hasDates ? endDate.format('YYYY-MM-DD') : undefined,
    ...(contract?.id ? { excludeContractId: contract.id } : {}),
  }, { skip: !hasDates || isCancelled, refetchOnMountOrArgChange: true })
  const rooms = (roomData?.rooms || []).filter((room) => room.status === 'available'
    && (!studentGender || room.gender === studentGender) && room.availableBeds?.length > 0)
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId)
  const floors = [...new Set(rooms.map((room) => String(room.floor)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  const visibleRooms = floor ? rooms.filter((room) => String(room.floor) === floor) : rooms
  const clearBed = () => form.setFieldValue(field('bedNumber'), undefined)

  return <div className="contract-fields">
        {!isCancelled && <>
        <div className="contract-form-grid"><Form.Item name={field('contractNumber')} label="Shartnoma raqami" rules={[{ required: true, whitespace: true, message: 'Shartnoma raqamini kiriting' }]}><Input maxLength={60} placeholder="Masalan: TTJ-2026-0001" /></Form.Item><Form.Item name={field('paymentType')} label="Shartnoma turi"><Segmented className="contract-status-segmented" block options={[{ value: 'daily', label: 'Kunlik' }, { value: 'monthly', label: 'Oylik' }]} onChange={(value) => { if (value !== 'daily') { form.setFieldValue(field('depositEnabled'), false); form.setFieldValue(field('depositAmount'), 0) } }} /></Form.Item></div>
        </>}
        <div className="contract-form-grid"><Form.Item name={field('startDate')} label="Boshlanish sanasi" rules={[{ required: true, message: 'Sanani kiriting' }]}><DatePicker onChange={clearBed} format="DD.MM.YYYY" placeholder="Sanani tanlang" style={{ width: '100%' }} /></Form.Item><Form.Item name={field('endDate')} label="Tugash sanasi" dependencies={[field('startDate')]} rules={[{ required: true, message: 'Sanani kiriting' }, ({ getFieldValue }) => ({ validator(_, value) { return !value || !getFieldValue(field('startDate')) || value.isAfter(getFieldValue(field('startDate')), 'day') ? Promise.resolve() : Promise.reject(new Error('Tugash sanasi boshlanish sanasidan keyin bo‘lishi kerak')) } })]}><DatePicker onChange={clearBed} disabledDate={(current) => Boolean(startDate && !current.isAfter(startDate, 'day'))} format="DD.MM.YYYY" placeholder="Sanani tanlang" style={{ width: '100%' }} /></Form.Item></div>
        {!isCancelled && <>
        <div className="contract-room-filter"><span>Bo‘sh xonalar</span><Select allowClear value={floor} placeholder="Barcha qavatlar" options={floors.map((value) => ({ value, label: `${value}-qavat` }))} onChange={(value) => { setFloor(value); form.setFieldValue(field('room'), undefined); clearBed() }} /></div>
        {roomsError && <Alert className="contract-room-feedback" type="error" showIcon title="Bo‘sh o‘rinlarni yuklab bo‘lmadi"
          description={apiErrorMessage(roomsError)} action={<Button onClick={refetch}>Qayta yuklash</Button>} />}
        {roomsFetching && <div className="contract-room-feedback"><Spin size="small" /> Bo‘sh o‘rinlar tekshirilmoqda…</div>}
        {!hasDates && <p className="contract-room-feedback">Avval shartnoma sanalarini tanlang.</p>}
        <Form.Item className="contract-room-field" name={field('room')} label="Xona" rules={[
          { required: true, message: 'Xonani tanlang' },
          { validator: (_, value) => !value || roomsFetching || rooms.some((room) => room.id === value)
            ? Promise.resolve() : Promise.reject(new Error('Tanlangan xonada shu sanalarda bo‘sh o‘rin yo‘q')) },
        ]}><RoomPicker rooms={visibleRooms} disabled={loading || roomsFetching || !hasDates}
          onRoomChange={clearBed} /></Form.Item>
        {selectedRoom && <Form.Item className="contract-bed-field" name={field('bedNumber')} label="O‘rin raqami" rules={[
          { required: true, message: 'Bo‘sh o‘rinni tanlang' },
          { validator: (_, value) => value == null || roomsFetching || selectedRoom.availableBeds.includes(value)
            ? Promise.resolve() : Promise.reject(new Error('Bu o‘rin band. Boshqa o‘rinni tanlang')) },
        ]}><BedPicker beds={selectedRoom.beds || []} disabled={loading || roomsFetching} /></Form.Item>}
        <Form.Item name={field('paymentAmount')} label={paymentType === 'daily' ? 'Bir kunlik to‘lov' : 'Bir oylik to‘lov'} rules={[{ required: true, type: 'number', min: 1, message: 'To‘lov summasi 0 dan katta bo‘lishi kerak' }]}><InputNumber min={1} precision={0} style={{ width: '100%' }} formatter={(value) => String(value || '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} parser={(value) => String(value || '').replace(/\D/g, '')} addonAfter="so‘m" /></Form.Item>
        {paymentType === 'daily' && <Form.Item label="Deposit" className="contract-deposit-field">
          <div className="contract-deposit-controls">
            <div className="contract-deposit-toggle">
              <ConfigProvider theme={depositSwitchTheme}>
                <Form.Item name={field('depositEnabled')} valuePropName="checked" noStyle>
                  <Switch className="contract-deposit-switch" aria-label="Depositni yoqish" disabled={loading}
                    onChange={(checked) => { if (!checked) form.setFieldValue(field('depositAmount'), 0) }} />
                </Form.Item>
              </ConfigProvider>
            </div>
            {depositEnabled && <Form.Item name={field('depositAmount')} className="contract-deposit-amount"
              rules={[{ required: true, type: 'number', min: 1, message: 'Deposit summasini kiriting' }]}>
              <InputNumber aria-label="Deposit summasi" placeholder="Summa" min={1} precision={0} style={{ width: '100%' }}
                formatter={(value) => String(value || '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                parser={(value) => String(value || '').replace(/\D/g, '')} addonAfter="so‘m" />
            </Form.Item>}
          </div>
        </Form.Item>}
        <div className="contract-payment-calculation"><div><span>Shartnoma muddati</span><strong>{calculation.durationDays} kun</strong></div><div><span>Hisob birligi</span><strong>{paymentType === 'daily' ? `${calculation.billingQuantity} kun` : `${calculation.billingQuantity} oy`}</strong></div><div><span>Shartnoma qiymati</span><strong>{calculation.totalAmount.toLocaleString('uz-UZ')} so‘m</strong></div></div>
        {paymentType === 'monthly' && calculation.billingQuantity > 0 && <div className="contract-payment-note">To‘lov {calculation.billingQuantity} oyga bo‘linadi. Har oy uchun {Number(paymentAmount || 0).toLocaleString('uz-UZ')} so‘mdan alohida hisob yuritiladi.</div>}
        {contract && <Form.Item name={field('status')} label="Shartnoma holati"><Segmented className="contract-status-segmented" block options={[{ value: 'active', label: 'Aktiv' }, { value: 'cancelled', label: 'Bekor qilish' }]} /></Form.Item>}
        <Form.Item className="contract-note-field" name={field('note')} label="Izoh"><Input.TextArea rows={3} maxLength={1000} showCount placeholder="Shartnoma bo‘yicha izoh" /></Form.Item>
        </>}
  </div>
}
