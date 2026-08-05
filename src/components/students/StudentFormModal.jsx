import { useState } from 'react'
import { Alert, Button, Checkbox, Form, Input, InputNumber, Modal, Segmented, Select } from 'antd'
import { useGetFacultiesQuery, useGetUniversitiesQuery, useLazyCheckStudentBlacklistQuery } from '../../store/baseApi'
import { StudentPhotoField } from './StudentPhotoField'

const initialValues = { fullName: '', phone: '', gender: 'male', parentPhone: '', university: undefined, faculty: undefined, address: '', course: 1, studentStatus: 'green', hasTaxContract: false, disciplinaryStatus: 'clear', disciplinaryNote: '', disabilityStatus: 'none', jshr: '', passport: '' }

export function StudentFormModal({ open, student, loading, error, onClose, onSubmit }) {
  const [form] = Form.useForm()
  const { data: universityData } = useGetUniversitiesQuery()
  const { data: facultyData } = useGetFacultiesQuery()
  const [photoFiles, setPhotoFiles] = useState([])
  const [removePhoto, setRemovePhoto] = useState(false)
  const [blacklistWarning, setBlacklistWarning] = useState(null)
  const [checkBlacklist] = useLazyCheckStudentBlacklistQuery()
  const universityId = Form.useWatch('university', form)
  const disciplinaryStatus = Form.useWatch('disciplinaryStatus', form)
  const universities = universityData?.universities || []
  const faculties = (facultyData?.faculties || []).filter((item) => (item.university?.id || item.university) === universityId)
  const prepare = (visible) => {
    if (!visible) return
    form.setFieldsValue(student ? { ...student, studentStatus: student.studentStatus || 'green', hasTaxContract: Boolean(student.hasTaxContract), disciplinaryStatus: student.disciplinaryStatus || 'clear', disabilityStatus: student.disabilityStatus || 'none', university: student.university?.id, faculty: student.faculty?.id, passport: `${student.passportSeries || ''}${student.passportNumber || ''}` } : initialValues)
    setPhotoFiles([])
    setRemovePhoto(false)
    setBlacklistWarning(null)
  }
  const checkIdentity = async () => {
    const jshr = String(form.getFieldValue('jshr') || '')
    const passport = String(form.getFieldValue('passport') || '').replace(/\s/g, '').toUpperCase()
    if (!/^\d{14}$/.test(jshr) && !/^[A-Z]{2}\d{7}$/.test(passport)) return setBlacklistWarning(null)
    try { setBlacklistWarning(await checkBlacklist({ jshr, passport }).unwrap()) }
    catch { setBlacklistWarning(null) }
  }

  return (
    <Modal open={open} onCancel={onClose} afterOpenChange={prepare} footer={null} destroyOnHidden width={900} rootClassName="student-form-modal" title={student ? 'Talabani tahrirlash' : 'Yangi talaba qo‘shish'}>
      <Form form={form} layout="vertical" initialValues={initialValues} requiredMark={false} onFinish={(values) => {
        const passport = String(values.passport || '').replace(/\s/g, '').toUpperCase()
        const studentValues = { ...values }
        delete studentValues.passport
        onSubmit({ values: { ...studentValues, passportSeries: passport.slice(0, 2), passportNumber: passport.slice(2) }, photoFiles, removePhoto })
      }} onValuesChange={(changed) => { if (Object.prototype.hasOwnProperty.call(changed, 'university')) form.setFieldValue('faculty', undefined) }}>
        <div className="student-form-grid">
          <Form.Item name="fullName" label="F.I.O" rules={[{ required: true, whitespace: true, message: 'F.I.O ni kiriting' }]}><Input placeholder="Familiya, ism, sharif" /></Form.Item>
          <Form.Item name="phone" label="Telefon" rules={[{ required: true, message: 'Telefon raqamini kiriting' }, { pattern: /^\+998\d{9}$/, message: 'Masalan: +998939119572' }]}><Input maxLength={13} inputMode="tel" placeholder="+998939119572" /></Form.Item>
          <Form.Item name="gender" label="Jinsi" rules={[{ required: true, message: 'Jinsini tanlang' }]}><Segmented className="student-gender-segmented" block options={[{ value: 'male', label: 'O‘g‘il bola' }, { value: 'female', label: 'Qiz bola' }]} /></Form.Item>
          <Form.Item name="parentPhone" label="Ota-onasi telefoni" rules={[{ pattern: /^\+998\d{9}$/, message: 'Masalan: +998939119572' }]}><Input maxLength={13} inputMode="tel" placeholder="+998939119572" /></Form.Item>
          <Form.Item name="university" label="Universitet" rules={[{ required: true, message: 'Universitetni tanlang' }]}><Select showSearch optionFilterProp="label" placeholder="Universitetni tanlang" options={universities.map((item) => ({ value: item.id, label: item.shortName ? `${item.name} (${item.shortName})` : item.name }))} /></Form.Item>
          <Form.Item name="faculty" label="Fakultet" rules={[{ required: true, message: 'Fakultetni tanlang' }]}><Select disabled={!universityId} showSearch optionFilterProp="label" placeholder="Fakultetni tanlang" options={faculties.map((item) => ({ value: item.id, label: item.name }))} /></Form.Item>
          <Form.Item name="address" label="Manzil"><Input placeholder="Doimiy yashash manzili" /></Form.Item>
          <Form.Item name="course" label="Kurs" rules={[{ required: true, message: 'Kursni kiriting' }]}><InputNumber min={1} max={6} precision={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="studentStatus" label="Talaba holati"><Segmented className="student-status-segmented" block options={[{ value: 'green', label: <span><i className="green" />Aktiv</span> }, { value: 'warning', label: <span><i className="warning" />Ogohlantirish</span> }, { value: 'red', label: <span><i className="red" />Yomon</span> }]} /></Form.Item>
          <Form.Item name="hasTaxContract" label="Soliq tizimidagi shartnoma" valuePropName="checked"><Checkbox className="student-tax-contract-checkbox">Soliq orqali shartnoma qilgan</Checkbox></Form.Item>
          {student && <Form.Item name="disciplinaryStatus" label="Intizomiy holati"><Segmented className="student-state-segmented" block options={[{ value: 'clear', label: 'Muammo yo‘q' }, { value: 'monitoring', label: 'Nazoratda' }, { value: 'blacklisted', label: 'Qora ro‘yxatda' }]} /></Form.Item>}
          <Form.Item name="disabilityStatus" label="Nogironlik holati"><Segmented className="student-state-segmented" block options={[{ value: 'none', label: 'Yo‘q' }, { value: 'has_disability', label: 'Mavjud' }]} /></Form.Item>
        </div>
        {student && disciplinaryStatus === 'blacklisted' && <Form.Item name="disciplinaryNote" label="Qora ro‘yxat sababi" rules={[{ required: true, whitespace: true, message: 'Qora ro‘yxat sababini kiriting' }]}><Input.TextArea rows={3} maxLength={1000} showCount placeholder="Intizomiy holat bo‘yicha batafsil izoh" /></Form.Item>}
        <div className="student-identity-grid">
          <Form.Item name="jshr" label="JSHR" rules={[{ required: true, pattern: /^\d{14}$/, message: 'JSHR 14 ta raqamdan iborat bo‘lsin' }]}><Input maxLength={14} inputMode="numeric" placeholder="14 xonali JSHR" onBlur={checkIdentity} /></Form.Item>
          <Form.Item name="passport" label="Pasport (ID karta)" rules={[{ required: true, pattern: /^[A-Za-z]{2}\s?\d{7}$/, message: 'Masalan: AA1234567' }]}><Input maxLength={10} placeholder="AA1234567" onInput={(event) => { event.currentTarget.value = event.currentTarget.value.toUpperCase() }} onBlur={checkIdentity} /></Form.Item>
        </div>
        {blacklistWarning?.blocked && <Alert className="student-blacklist-alert" type="error" showIcon message="Diqqat: bu shaxs qora ro‘yxatda" description={blacklistWarning.reason} />}
        <Form.Item label="Yuz rasmi"><StudentPhotoField currentPhoto={student?.photo} fileList={photoFiles} removed={removePhoto} onChange={(files) => { setPhotoFiles(files); setRemovePhoto(false) }} onRemoveCurrent={() => setRemovePhoto(true)} /></Form.Item>
        {error && <div className="form-error">{error}</div>}
        <div className="student-form-actions"><Button htmlType="submit" loading={loading} className="student-submit-btn">{student ? 'Yangilash' : 'Saqlash'}</Button><Button onClick={onClose}>Yopish</Button></div>
      </Form>
    </Modal>
  )
}
