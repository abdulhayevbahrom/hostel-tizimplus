import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import './ContractExpiryFilter.css';

export function ContractExpiryFilter({ value, onChange }) {
  return (
    <label className="contract-expiry-filter">
      <span>Shartnoma tugash sanasi</span>
      <DatePicker.RangePicker
        value={value}
        onChange={onChange}
        format="DD.MM.YYYY"
        allowClear
        placeholder={['Sanadan', 'Sanagacha']}
        aria-label="Shartnoma tugash sanasi oralig‘i"
        presets={[
          { label: 'Bugun', value: () => [dayjs(), dayjs()] },
          { label: '2 kun ichida', value: () => [dayjs(), dayjs().add(2, 'day')] },
          { label: '7 kun ichida', value: () => [dayjs(), dayjs().add(7, 'day')] },
          { label: '30 kun ichida', value: () => [dayjs(), dayjs().add(30, 'day')] },
        ]}
      />
    </label>
  );
}
