import { useEffect, useState } from 'react'
import { splitDuration } from '../../utils/paymentProgress'
import { vacancyLossProgress } from '../../utils/vacancyLossProgress'
import { AnimatedNumber } from '../payment-progress/AnimatedNumber'
import './LiveVacancyLossPanel.css'

function LossCard({ title, amount, elapsed, detail }) {
  const parts = splitDuration(elapsed)
  return <article className="live-loss-card">
    <h3>{title}</h3>
    <strong className="live-loss-amount"><AnimatedNumber value={Math.floor(amount).toLocaleString('uz-UZ')} /> <small>so‘m</small></strong>
    <span className="live-loss-time-label">O‘tgan vaqt</span>
    <div className="live-loss-clock" aria-label={`${parts.days} kun ${parts.hours} soat ${parts.minutes} minut ${parts.seconds} sekund`}>
      {Object.values(parts).map((value, index) => <div key={index}>
        <strong><AnimatedNumber value={String(value).padStart(2, '0')} /></strong>
        <span>{['kun', 'soat', 'minut', 'sekund'][index]}</span>
      </div>)}
    </div>
    <p>{detail}</p>
  </article>
}

export function LiveVacancyLossPanel({ summary, period }) {
  const [clock, setClock] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  if (!summary?.live) return null
  const progress = vacancyLossProgress(summary.live, clock)
  return <section className="light-panel live-loss-panel">
    <header><h2>Yo‘qotilayotgan daromad</h2><span>Har soniyada yangilanadi</span></header>
    <div className="live-loss-grid">
      <LossCard title="Bugungi yo‘qotish" amount={progress.todayLoss} elapsed={progress.todayElapsed}
        detail={`${summary.live.todayVacantBeds} ta bo‘sh o‘rin · kunlik narx: ${Number(summary.dailyRate).toLocaleString('uz-UZ')} so‘m`} />
      <LossCard title="Oylik yo‘qotish" amount={progress.monthLoss} elapsed={progress.monthElapsed}
        detail={`${period} · tugagan kunlar va bugunning o‘tgan qismi`} />
    </div>
    <p className="live-loss-help">Bo‘sh o‘rinlar uchun yo‘qotish kunlik narx va o‘tgan vaqtga mutanosib hisoblanadi. Ta’mirdagi xonalar hisobga olinmaydi.</p>
  </section>
}
