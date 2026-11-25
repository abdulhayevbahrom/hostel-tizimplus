import { Button, Form, Modal } from 'antd'
import dayjs from 'dayjs'
import { ContractFormFields } from './ContractFormFields'
import { createContractInitialValues } from '../../utils/contractForm'

function ContractForm({ contract, rooms, studentGender, loading, error, onClose, onSubmit }) {
  const initialValues = contract ? { ...contract, room: contract.room?.id || contract.room,
    paymentType: contract.paymentType || 'monthly', paymentAmount: contract.paymentAmount ?? contract.monthlyAmount ?? 0,
    depositEnabled: Boolean(contract.depositEnabled), depositAmount: contract.depositAmount || 0,
    startDate: dayjs(contract.startDate), endDate: dayjs(contract.endDate) } : createContractInitialValues()
  return <Form layout="vertical" requiredMark={false} initialValues={initialValues} disabled={loading}
    onFinish={(values) => onSubmit({ ...initialValues, ...values,
      startDate: values.startDate.format('YYYY-MM-DD'), endDate: values.endDate.format('YYYY-MM-DD') })}>
    <ContractFormFields contract={contract} rooms={rooms} studentGender={studentGender} loading={loading} />
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="contract-form-actions"><Button htmlType="submit" loading={loading} className="contract-submit-btn">{contract ? 'Yangilash' : 'Shartnoma tuzish'}</Button><Button onClick={onClose}>Yopish</Button></div>
  </Form>
}

export function ContractFormModal({ open, contract, rooms, studentGender, loading, error, onClose, onSubmit }) {
  return <Modal open={open} onCancel={loading ? undefined : onClose} closable={!loading}
    mask={{ closable: !loading }} keyboard={!loading} footer={null} destroyOnHidden width={650}
    rootClassName="contract-form-modal" title={contract ? 'Shartnomani tahrirlash' : 'Yangi shartnoma tuzish'}>
    {open && <ContractForm key={contract?.id || 'new'} contract={contract} rooms={rooms} studentGender={studentGender} loading={loading}
      error={error} onClose={onClose} onSubmit={onSubmit} />}
  </Modal>
}
