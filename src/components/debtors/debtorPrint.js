const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
const amount = (value) => Number(value || 0).toLocaleString('uz-UZ')

export function printDebtorList({ debtors, periodLabel, printedAt, isFuturePeriod, summary }) {
  const frame = document.createElement('iframe')
  frame.setAttribute('title', 'Qarzdorlar ro‘yxatini chop etish')
  frame.style.cssText = 'position:fixed;inset:0;z-index:99999;width:100vw;height:100vh;height:100dvh;border:0;background:#fff'
  document.body.appendChild(frame)
  const debtLabel = isFuturePeriod ? 'Kutilayotgan summa' : 'Jami qarz'
  const rows = debtors.map((debtor, index) => {
    const rooms = [...new Set((debtor.contracts || []).map((contract) => contract.room ? `${contract.room.roomNumber}-xona, ${contract.room.floor}-qavat` : '').filter(Boolean))].join('; ') || '—'
    return `<tr><td>${index + 1}</td><td>${safe(debtor.student?.fullName || '—')}</td><td>${safe(debtor.student?.phone || '—')}</td><td>${safe(rooms)}</td><td>${safe((debtor.periods || []).map((item) => item.periodKey).join(', '))}</td><td>${amount(isFuturePeriod ? debtor.waitingAmount : debtor.totalDebt)}</td><td>${amount(debtor.overdueDebt)}</td></tr>`
  }).join('') || '<tr><td colspan="7">Ma’lumot topilmadi</td></tr>'
  const total = isFuturePeriod ? summary.waitingAmount : summary.totalDebt
  const printDocument = frame.contentDocument
  printDocument.open()
  printDocument.write(`<!doctype html><html><head><meta charset="utf-8"><title>Qarzdorlar ro‘yxati</title><style>
    @page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}body{margin:0;color:#111;font-family:Arial,sans-serif;font-size:9pt}header{display:flex;justify-content:space-between;gap:16px;padding-bottom:8px;border-bottom:1px solid #222}h1{margin:0;font-size:16pt}p,header small{margin:4px 0 0}.summary{display:flex;flex-wrap:wrap;gap:16px;margin:10px 0}table{width:100%;border-collapse:collapse}th,td{padding:5px 4px;border:1px solid #555;vertical-align:top;text-align:left;word-break:break-word}th{background:#eee;font-size:8pt}td:first-child{width:6mm;text-align:center}tr{break-inside:avoid}thead{display:table-header-group}@media screen{body{max-width:210mm;margin:12px auto;padding:12mm;box-shadow:0 1px 15px #0003}}
  </style></head><body><header><div><h1>${isFuturePeriod ? 'Kutilayotgan to‘lovlar ro‘yxati' : 'Qarzdor talabalar ro‘yxati'}</h1><p>Hisobot davri: ${safe(periodLabel)}</p></div><small>Chop etilgan sana: ${safe(printedAt)}</small></header><div class="summary"><span>Talabalar soni: <b>${debtors.length}</b></span><span>${debtLabel}: <b>${amount(total)} so‘m</b></span>${!isFuturePeriod ? `<span>Muddati o‘tgan: <b>${amount(summary.overdueDebt)} so‘m</b></span>` : ''}</div><table><thead><tr><th>№</th><th>Talaba</th><th>Telefon</th><th>Xona</th><th>Qarzdor davr</th><th>${debtLabel}</th><th>Muddati o‘tgan</th></tr></thead><tbody>${rows}</tbody></table></body></html>`)
  printDocument.close()
  const cleanup = () => frame.remove()
  frame.contentWindow.addEventListener('afterprint', cleanup, { once: true })
  setTimeout(() => { frame.contentWindow.focus(); frame.contentWindow.print() }, 500)
  setTimeout(() => { if (frame.isConnected) cleanup() }, 60000)
}
