import { Modal } from 'antd'
import { StudentForm } from './StudentForm'

export function StudentFormModal({ open, student, loading, error, onClose, onSubmit }) {
  return <Modal open={open} onCancel={loading ? undefined : onClose} closable={!loading}
    mask={{ closable: !loading }} keyboard={!loading} footer={null} destroyOnHidden width={900}
    rootClassName="student-form-modal" title={student ? 'Talabani tahrirlash' : 'Yangi talaba qo‘shish'}>
    {open && <StudentForm key={student?.id || 'new'} student={student} loading={loading}
      error={error} onClose={onClose} onSubmit={onSubmit} />}
  </Modal>
}
