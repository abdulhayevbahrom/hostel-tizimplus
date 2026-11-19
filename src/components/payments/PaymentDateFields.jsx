import { DatePicker, Form, TimePicker } from 'antd'
import './PaymentDateFields.css'

export function PaymentDateFields() {
  return (
    <div className="payment-date-fields">
      <Form.Item name="paymentDate" label="To‘lov sanasi" rules={[{ required: true, message: 'To‘lov sanasini tanlang' }]}>
        <DatePicker allowClear={false} format="DD.MM.YYYY" />
      </Form.Item>
      <Form.Item name="paymentTime" label="To‘lov vaqti" rules={[{ required: true, message: 'To‘lov vaqtini tanlang' }]}>
        <TimePicker allowClear={false} format="HH:mm" />
      </Form.Item>
    </div>
  )
}
