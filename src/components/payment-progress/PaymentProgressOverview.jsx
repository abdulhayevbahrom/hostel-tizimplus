import { CheckCircleOutlined, ClockCircleOutlined, WalletOutlined } from '@ant-design/icons'
import { AnimatedNumber } from './AnimatedNumber'
import './PaymentProgress.css'

const money = (amount) => Math.floor(amount).toLocaleString('uz-UZ')

function ProgressRing({ percent }) {
  const radius = 76
  const circumference = 2 * Math.PI * radius
  return <div className="pp-ring">
    <svg viewBox="0 0 184 184" aria-hidden="true">
      <circle cx="92" cy="92" r={radius} className="pp-ring-track" />
      <circle cx="92" cy="92" r={radius} className="pp-ring-value" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)} transform="rotate(-90 92 92)" />
    </svg>
    <div><strong><AnimatedNumber value={percent.toFixed(1)} /><small>%</small></strong><span>to‘lov oqlandi</span></div>
  </div>
}

export function PaymentProgressOverview({ summary }) {
  const percent = summary.paid ? summary.earned / summary.paid * 100 : 0
  return (
<section className="pp-overview" aria-label="Umumiy to‘lov progressi">
        <div className="pp-hero">
          <div className="pp-hero-content"><span className="pp-hero-kicker"><WalletOutlined /> TO‘LOVLAR HOLATI</span><h2>Pulingizning vaqt<br />bilan o‘lchangan qiymati.</h2><p>Tanlangan oyga tegishli to‘lovlar qancha oqlangani va qancha xizmat hali oldinda ekanini kuzating.</p><div className="pp-hero-total"><span>Jami to‘langan</span><strong><AnimatedNumber value={money(summary.paid)} /> <small>so‘m</small></strong></div></div>
          <div className="pp-hero-visual"><ProgressRing percent={percent} /><div className="pp-ring-legend"><span><i />Oqlangan</span><span><i />Qolgan</span></div></div>
        </div>
        <div className="pp-summary-stack">
          <div className="pp-summary-card"><div className="pp-stat-icon pp-icon-earned"><CheckCircleOutlined /></div><div><span>Oqlangan summa</span><strong><AnimatedNumber value={money(summary.earned)} /> <small>so‘m</small></strong><p>Ko‘rsatilgan turar joy xizmati</p></div><span className="pp-stat-percent"><AnimatedNumber value={percent.toFixed(1)} />%</span></div>
          <div className="pp-summary-card"><div className="pp-stat-icon pp-icon-remaining"><ClockCircleOutlined /></div><div><span>Hali oqlanmagan</span><strong><AnimatedNumber value={money(summary.remaining)} /> <small>so‘m</small></strong><p>Oldinda ko‘rsatiladigan xizmat</p></div><span className="pp-stat-percent"><AnimatedNumber value={(summary.paid ? 100 - percent : 0).toFixed(1)} />%</span></div>
          <div className="pp-summary-foot"><span><i className="pp-dot pp-dot-earned" /><strong>{summary.active}</strong> nafar · to‘lovi oqlanmoqda</span><span><CheckCircleOutlined /><strong>{summary.completed}</strong> nafar · to‘lovi oqlangan</span>{summary.overdue > 0 && <span className="pp-unpaid-amount"><ClockCircleOutlined /><strong>{summary.overdue}</strong> nafar · to‘lovi yetmay qolgan</span>}{summary.unpaid > 0 && <span className="pp-unpaid-amount"><WalletOutlined /><strong>{summary.unpaid}</strong> nafar · to‘lov qilmagan</span>}{summary.upcoming > 0 && <span><ClockCircleOutlined /><strong>{summary.upcoming}</strong> nafar · hali boshlanmagan</span>}</div>
        </div>
      </section>
  )
}
