const columns = [
  { header: '№', key: 'number', width: 7 },
  { header: 'Talaba', key: 'student', width: 30 },
  { header: 'Telefon', key: 'phone', width: 18 },
  { header: 'Xona', key: 'rooms', width: 24 },
  { header: 'Qarzdor davr', key: 'periods', width: 24 },
  { header: 'To‘lov muddati', key: 'deadline', width: 18 },
  { header: 'Summa (so‘m)', key: 'debt', width: 18 },
  { header: 'Muddati o‘tgan (so‘m)', key: 'overdue', width: 22 },
]

const asDate = (value) => value ? new Date(value) : null

export async function downloadDebtorsExcel({ debtors, periodLabel, periodKey, isFuturePeriod, summary }) {
  const ExcelJSImport = await import('exceljs')
  const ExcelJS = ExcelJSImport.default || ExcelJSImport
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Tizim Plus'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet(isFuturePeriod ? 'Kutilayotgan to‘lovlar' : 'Qarzdorlar', {
    views: [{ state: 'frozen', ySplit: 6 }],
    properties: { defaultRowHeight: 20 },
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  worksheet.columns = columns

  const title = isFuturePeriod ? 'Kutilayotgan to‘lovlar ro‘yxati' : 'Qarzdor talabalar ro‘yxati'
  const debtLabel = isFuturePeriod ? 'Kutilayotgan summa' : 'Jami qarz'
  const total = Number(isFuturePeriod ? summary.waitingAmount : summary.totalDebt) || 0
  worksheet.mergeCells('A1:H1')
  worksheet.getCell('A1').value = title
  worksheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF173B3A' } }
  worksheet.getRow(1).height = 28
  worksheet.mergeCells('A2:H2')
  worksheet.getCell('A2').value = `Hisobot davri: ${periodLabel}`
  worksheet.mergeCells('A3:H3')
  worksheet.getCell('A3').value = `Talabalar soni: ${debtors.length}     ${debtLabel}: ${total.toLocaleString('uz-UZ')} so‘m${isFuturePeriod ? '' : `     Muddati o‘tgan: ${Number(summary.overdueDebt || 0).toLocaleString('uz-UZ')} so‘m`}`
  worksheet.mergeCells('A4:H4')
  worksheet.getCell('A4').value = `Yuklangan sana: ${new Date().toLocaleString('uz-UZ')}`
  for (const rowNumber of [2, 3, 4]) worksheet.getCell(`A${rowNumber}`).font = { name: 'Arial', size: 9, italic: rowNumber !== 3, color: { argb: 'FF64748B' } }

  const headerRow = worksheet.getRow(6)
  headerRow.values = columns.map((column) => column.header)
  headerRow.height = 34
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })

  debtors.forEach((debtor, index) => {
    const rooms = [...new Set((debtor.contracts || []).map((contract) => contract.room ? `${contract.room.block ? `${contract.room.block} · ` : ''}${contract.room.roomNumber}-xona, ${contract.room.floor}-qavat` : '').filter(Boolean))].join('; ')
    const row = worksheet.addRow({
      number: index + 1,
      student: debtor.student?.fullName || '',
      phone: debtor.student?.phone || '',
      rooms: rooms || '—',
      periods: (debtor.debtPeriods || debtor.periods || []).map((item) => item.periodKey).join(', '),
      deadline: asDate(isFuturePeriod ? debtor.oldestDueDate : debtor.paymentDeadline),
      debt: Number(isFuturePeriod ? debtor.waitingAmount : debtor.totalDebt) || 0,
      overdue: Number(debtor.overdueDebt || 0),
    })
    row.font = { name: 'Arial', size: 10 }
    row.alignment = { vertical: 'middle', wrapText: true }
    if (index % 2 === 1) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4FAF8' } }
  })

  worksheet.autoFilter = { from: 'A6', to: 'H6' }
  worksheet.getColumn('phone').numFmt = '@'
  worksheet.getColumn('deadline').numFmt = 'dd.mm.yyyy'
  worksheet.getColumn('debt').numFmt = '#,##0'
  worksheet.getColumn('overdue').numFmt = '#,##0'
  worksheet.getColumn('number').alignment = { horizontal: 'center', vertical: 'middle' }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${isFuturePeriod ? 'Kutilayotgan-tolovlar' : 'Qarzdorlar'}-${periodKey}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
