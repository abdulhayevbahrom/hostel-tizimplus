import { useState } from 'react'
import { ConfigProvider, Form } from 'antd'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { apiErrorMessage, useAdmitStudentMutation } from '../../store/baseApi'
import { createContractInitialValues } from '../../utils/contractForm'
import { StudentForm } from './StudentForm'
import { ContractFormFields } from './ContractFormFields'
import './Students.css'
import './StudentProfile.css'
import './StudentAdmission.css'

function AdmissionContractSection({ saving }) {
  const gender = Form.useWatch('gender')
  return <section className="student-form-section">
    <h2>Shartnoma ma’lumotlari</h2>
    <p className="student-admission-help">Xonani va tanlangan sanalarda bo‘sh bo‘lgan o‘rin raqamini tanlang.</p>
    <ContractFormFields key={gender} studentGender={gender} prefix={['contract']} loading={saving} />
  </section>
}

export function StudentAdmissionPage() {
  const navigate = useNavigate()
  const [initialContract] = useState(createContractInitialValues)
  const [error, setError] = useState('')
  const [admitStudent, { isLoading: saving }] = useAdmitStudentMutation()
  const submit = async ({ values, photoFiles }) => {
    setError('')
    const { contract, ...student } = values
    const body = new FormData()
    body.append('payload', JSON.stringify({ student, contract: { ...contract,
      startDate: contract.startDate.format('YYYY-MM-DD'), endDate: contract.endDate.format('YYYY-MM-DD') } }))
    if (photoFiles[0]?.originFileObj) body.append('photo', photoFiles[0].originFileObj)
    try {
      const result = await admitStudent(body).unwrap()
      toast.success('Talaba qabul qilindi va shartnoma tuzildi')
      navigate(`/student/${result.student.id}`, { replace: true })
    } catch (requestError) {
      const message = apiErrorMessage(requestError)
      setError(message)
      toast.error(message)
    }
  }
  return <ConfigProvider theme={{ token: {
    colorPrimary: '#0f766e',
    colorBorder: '#718b98',
    colorText: '#203844',
    colorTextPlaceholder: '#536975',
    colorTextDisabled: '#697c87',
    colorBgContainer: '#f8fafb',
    colorBgContainerDisabled: '#eaf0f3',
    controlHeight: 42,
    lineWidth: 1.5,
  } }}>
    <div className="student-admission-page">
      <StudentForm className="student-admission-form" studentHeading="Talaba ma’lumotlari"
        loading={saving} error={error} additionalInitialValues={{ contract: initialContract }}
        submitLabel="Saqlash" cancelLabel="Bekor qilish" onClose={() => navigate('/students')}
        onValuesChange={(changed, form) => { if (changed.gender) { form.setFieldValue(['contract', 'room'], undefined); form.setFieldValue(['contract', 'bedNumber'], undefined) } }}
        onSubmit={submit}>
        <AdmissionContractSection saving={saving} />
      </StudentForm>
    </div>
  </ConfigProvider>
}
