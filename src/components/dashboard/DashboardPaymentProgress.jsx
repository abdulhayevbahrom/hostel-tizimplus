import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Skeleton } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { apiErrorMessage, useGetPaymentProgressQuery } from '../../store/baseApi'
import { calculatePaymentProgress, summarizePaymentProgress } from '../../utils/paymentProgress'
import { PaymentProgressOverview } from '../payment-progress/PaymentProgressOverview'

export function DashboardPaymentProgress({ period }) {
  const [clock, setClock] = useState(Date.now)
  const { currentData, isFetching, error, refetch, fulfilledTimeStamp } = useGetPaymentProgressQuery(period, {
    refetchOnFocus: true, refetchOnReconnect: true,
  })
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const offset = currentData?.serverTime && fulfilledTimeStamp ? Date.parse(currentData.serverTime) - fulfilledTimeStamp : 0
  const now = clock + offset
  const summary = useMemo(() => summarizePaymentProgress((currentData?.rows || []).map((row) => calculatePaymentProgress(row, now))), [currentData, now])

  return <section className="dashboard-payment-progress" aria-label="To‘lov progressi">
    <header className="dashboard-progress-heading">
      <h2>To‘lov progressi</h2>
      <div><span>{period}</span><span className="pp-live"><i />Jonli hisob</span>
        <Button icon={<ReloadOutlined spin={isFetching} />} aria-label="Dashboard to‘lov progressini yangilash" onClick={refetch} disabled={isFetching} />
      </div>
    </header>
    {error ? <Alert type="error" showIcon title="To‘lov progressini yuklab bo‘lmadi" description={apiErrorMessage(error)} action={<Button onClick={refetch}>Qayta urinish</Button>} />
      : !currentData ? <Skeleton active paragraph={{ rows: 5 }} /> : <PaymentProgressOverview summary={summary} />}
  </section>
}
